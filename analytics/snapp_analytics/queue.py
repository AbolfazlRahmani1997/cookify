from __future__ import annotations

import os
import threading
import time
from datetime import datetime, timezone
from typing import Any

from snapp_analytics.store import classify_saved, connect, upsert_raw

_worker_started = False
_worker_lock = threading.Lock()


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def enqueue_items(items: list[dict[str, Any]]) -> dict[str, int]:
    rows = []
    for item in items:
        snapp_id = str(item.get("snapp_id") or item.get("id") or "").removeprefix("sm-").strip()
        title = str(item.get("title") or "").strip()
        if not snapp_id or not title:
            continue
        image = str(item.get("image") or "")
        rows.append(
            {
                "snapp_id": snapp_id,
                "document_id": item.get("document_id"),
                "query": item.get("query") or "",
                "item": {
                    "id": snapp_id,
                    "title": title,
                    "price": item.get("price") or 0,
                    "discount": item.get("discount") or 0,
                    "subcategory_slug": item.get("subcategory_slug") or item.get("category") or "",
                    "subcategory_id": item.get("subcategory_id") or "",
                    "subcategory_title": item.get("subcategory_title") or "",
                    "category_id": item.get("category_id") or "",
                    "category_title": item.get("category_title") or "",
                    "category_slug": item.get("category_slug") or "",
                    "images": [{"main": image}] if image else [],
                    "product_entity": item.get("product_entity") or "",
                },
            }
        )
    saved = upsert_raw(rows) if rows else 0
    conn = connect()
    queued = 0
    now = _now()
    with conn:
        for row in rows:
            snapp_id = row["snapp_id"]
            title = row["item"]["title"]
            existing = conn.execute(
                "SELECT status FROM classify_queue WHERE snapp_id = ?",
                (snapp_id,),
            ).fetchone()
            if existing and existing["status"] in ("pending", "processing", "done"):
                continue
            classified = conn.execute(
                "SELECT classify_source FROM products WHERE snapp_id = ?",
                (snapp_id,),
            ).fetchone()
            if classified and classified["classify_source"] == "llm":
                continue
            conn.execute(
                """
                INSERT INTO classify_queue (snapp_id, title, status, attempts, last_error, created_at, updated_at)
                VALUES (?, ?, 'pending', 0, NULL, ?, ?)
                ON CONFLICT(snapp_id) DO UPDATE SET
                  title = excluded.title,
                  status = 'pending',
                  last_error = NULL,
                  updated_at = excluded.updated_at
                """,
                (snapp_id, title, now, now),
            )
            queued += 1
    conn.close()
    return {"saved": saved, "queued": queued}


def queue_stats() -> dict[str, int]:
    conn = connect()
    out = {"pending": 0, "processing": 0, "done": 0, "error": 0}
    for row in conn.execute("SELECT status, COUNT(*) n FROM classify_queue GROUP BY status"):
        out[str(row["status"])] = int(row["n"])
    conn.close()
    return out


def _claim() -> tuple[str, str, int] | None:
    conn = connect()
    row = conn.execute(
        """
        SELECT snapp_id, title, attempts FROM classify_queue
        WHERE status = 'pending'
        ORDER BY created_at
        LIMIT 1
        """
    ).fetchone()
    if row is None:
        conn.close()
        return None
    now = _now()
    with conn:
        conn.execute(
            """
            UPDATE classify_queue
            SET status = 'processing', updated_at = ?, attempts = attempts + 1
            WHERE snapp_id = ? AND status = 'pending'
            """,
            (now, row["snapp_id"]),
        )
    conn.close()
    return str(row["snapp_id"]), str(row["title"]), int(row["attempts"]) + 1


def _finish(snapp_id: str, status: str, error: str = "") -> None:
    conn = connect()
    with conn:
        conn.execute(
            "UPDATE classify_queue SET status = ?, last_error = ?, updated_at = ? WHERE snapp_id = ?",
            (status, error or None, _now(), snapp_id),
        )
    conn.close()


def process_one() -> str:
    claimed = _claim()
    if claimed is None:
        return "empty"
    snapp_id, _title, attempts = claimed
    try:
        tagged = classify_saved(snapp_id)
    except Exception as exc:  # noqa: BLE001
        _finish(snapp_id, "error" if attempts >= 3 else "pending", str(exc))
        return "retry"
    if tagged is None:
        _finish(snapp_id, "error", "محصول در دیتاست نیست")
        return "error"
    _finish(snapp_id, "done")
    return "done"


def worker(stop: threading.Event) -> None:
    while not stop.is_set():
        try:
            result = process_one()
        except Exception:
            result = "retry"
        if result == "empty":
            stop.wait(float(os.getenv("COOKIFY_QUEUE_IDLE", "2")))
        elif result == "retry":
            stop.wait(5)
        else:
            stop.wait(0.2)


def start_worker() -> threading.Event:
    global _worker_started
    stop = threading.Event()
    with _worker_lock:
        if _worker_started:
            return stop
        threading.Thread(target=worker, args=(stop,), name="classify-queue", daemon=True).start()
        _worker_started = True
    return stop
