from __future__ import annotations

import json
import os
import time
import uuid
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlencode

import httpx

from snapp_analytics.paths import RAW_DIR, ensure_dirs

SEARCH_URL = "https://svc.snapp.market/mobile/v3/product-vendors/search"
PRODUCT_URL = "https://svc.snapp.market/express-search/v1/pb/products/"
CATEGORIES_URL = "https://svc.snapp.market/express-search/categories"

DEFAULT_LAT = os.getenv("SNAPP_LAT", "35.757499")
DEFAULT_LNG = os.getenv("SNAPP_LONG", "51.317662")
DEFAULT_UDID = os.getenv("SNAPP_UDID", f"cookify-{uuid.uuid4()}")


class SnappClient:
    def __init__(
        self,
        lat: str = DEFAULT_LAT,
        lng: str = DEFAULT_LNG,
        udid: str = DEFAULT_UDID,
        timeout: float = 20.0,
        pause: float = 0.45,
    ) -> None:
        self.lat = lat
        self.lng = lng
        self.udid = udid
        self.pause = pause
        self.http = httpx.Client(
            timeout=timeout,
            headers={
                "Accept": "application/json",
                "User-Agent": (
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
                ),
                "Origin": "https://snapp.market",
                "Referer": "https://snapp.market/",
            },
        )

    def close(self) -> None:
        self.http.close()

    def search(self, query: str, page: int = 1, size: int = 20) -> dict[str, Any]:
        params = {
            "page": page,
            "query": query,
            "new_search": 1,
            "new_design": 0,
            "size": size,
            "origin": "sl-search",
            "source": 2,
            "personalize": "true",
            "client": "PWA",
            "deviceType": "PWA",
            "appVersion": "1.401.4",
            "UDID": self.udid,
            "lat": self.lat,
            "long": self.lng,
        }
        # superType[] must stay as a list in query string
        qs = urlencode(params, doseq=True) + "&superType%5B%5D=4"
        res = self.http.get(f"{SEARCH_URL}?{qs}")
        res.raise_for_status()
        payload = res.json()
        ensure_dirs()
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        safe_q = "".join(ch if ch.isalnum() else "_" for ch in query)[:40]
        path = RAW_DIR / f"{safe_q}_p{page}_{stamp}.json"
        path.write_text(
            json.dumps(
                {
                    "fetched_at": stamp,
                    "query": query,
                    "page": page,
                    "size": size,
                    "lat": self.lat,
                    "long": self.lng,
                    "response": payload,
                },
                ensure_ascii=False,
            ),
            encoding="utf-8",
        )
        time.sleep(self.pause)
        return payload

    def product(self, product_id: str) -> dict[str, Any]:
        res = self.http.get(
            f"{PRODUCT_URL}{product_id}",
            params={
                "client": "PWA",
                "deviceType": "PWA",
                "appVersion": "1.402.0",
                "UDID": self.udid,
                "lat": self.lat,
                "long": self.lng,
            },
        )
        res.raise_for_status()
        data = res.json()
        time.sleep(self.pause)
        return data if isinstance(data, dict) else {}

    def categories(self) -> dict[str, Any]:
        res = self.http.get(
            CATEGORIES_URL,
            params={
                "client": "PWA",
                "deviceType": "PWA",
                "appVersion": "1.402.0",
                "UDID": self.udid,
                "lat": self.lat,
                "long": self.lng,
            },
        )
        res.raise_for_status()
        data = res.json()
        return data if isinstance(data, dict) else {}

    def crawl(
        self,
        query: str,
        max_pages: int = 8,
        size: int = 20,
    ) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        seen: set[str] = set()
        for page in range(1, max_pages + 1):
            payload = self.search(query, page=page, size=size)
            items = payload.get("items") or []
            if not items:
                break
            for item in items:
                pid = str(item.get("id", ""))
                if not pid or pid in seen:
                    continue
                seen.add(pid)
                try:
                    detail = self.product(pid)
                except Exception:
                    detail = {}
                if detail:
                    item = dict(item)
                    for key in (
                        "product_entity",
                        "category_id",
                        "category_title",
                        "category_slug",
                        "subcategory_id",
                        "subcategory_title",
                        "subcategory_slug",
                    ):
                        if detail.get(key) not in (None, ""):
                            item[key] = detail[key]
                rows.append(
                    {
                        "snapp_id": pid,
                        "document_id": item.get("document_id"),
                        "query": query,
                        "page": page,
                        "item": item,
                        "filters": payload.get("filters") or {},
                        "total": payload.get("total"),
                    }
                )
            if len(items) < size:
                break
            total = payload.get("total") or 0
            if page * size >= int(total):
                break
        return rows
