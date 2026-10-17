from __future__ import annotations

import json
import os
import sqlite3
import threading
from datetime import datetime, timezone
from typing import Any, Iterable

import psycopg
from psycopg.rows import dict_row

from snapp_analytics.preprocess import norm_text, preprocess_item
from snapp_analytics.paths import DB_PATH, PARQUET_PATH, ensure_dirs

SCHEMA = """
CREATE TABLE IF NOT EXISTS products (
  snapp_id TEXT PRIMARY KEY,
  document_id TEXT,
  title TEXT NOT NULL,
  title_norm TEXT,
  price INTEGER,
  discount INTEGER,
  discount_ratio REAL,
  price_final INTEGER,
  image_url TEXT,
  subcategory_slug TEXT,
  category TEXT,
  brand TEXT,
  amount_value REAL,
  amount_unit TEXT,
  grams REAL,
  milliliters REAL,
  price_per_100g REAL,
  price_per_100ml REAL,
  price_per_piece REAL,
  is_grocery INTEGER,
  ingredient_key TEXT,
  product_form TEXT,
  llm_json TEXT,
  classify_source TEXT,
  query_hits TEXT,
  tokens TEXT,
  raw_json TEXT,
  fetched_at TEXT,
  preprocessed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_title ON products(title_norm);
CREATE TABLE IF NOT EXISTS classify_queue (
  snapp_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_classify_queue_status ON classify_queue(status);
CREATE TABLE IF NOT EXISTS match_choices (
  ingredient TEXT NOT NULL,
  snapp_id TEXT NOT NULL,
  picks INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (ingredient, snapp_id)
);
CREATE TABLE IF NOT EXISTS snapp_brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS snapp_categories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT,
  parent_id TEXT
);
CREATE TABLE IF NOT EXISTS snapp_subcategories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);
"""


class Row(dict):
    def __getitem__(self, key):
        if isinstance(key, int):
            return list(self.values())[key]
        return dict.__getitem__(self, key)


class Conn:
    """Postgres connection with the same execute/commit shape the catalog used on SQLite."""

    def __init__(self, raw: psycopg.Connection):
        self.raw = raw

    def execute(self, sql: str, args: tuple | list | None = None):
        sql = sql.replace("?", "%s")
        cur = self.raw.execute(sql, args or None)
        rows = []
        if cur.description:
            rows = [Row(r) for r in cur.fetchall()]
        return _Result(rows)

    def executescript(self, script: str) -> None:
        for stmt in script.split(";"):
            if stmt.strip():
                self.raw.execute(stmt)

    def commit(self) -> None:
        self.raw.commit()

    def close(self) -> None:
        self.raw.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        if exc_type:
            self.raw.rollback()
        else:
            self.raw.commit()
        return False


class _Result:
    def __init__(self, rows: list[Row]):
        self._rows = rows

    def fetchone(self):
        return self._rows[0] if self._rows else None

    def fetchall(self):
        return self._rows

    def __iter__(self):
        return iter(self._rows)


def database_url() -> str:
    return os.environ.get(
        "DATABASE_URL",
        "postgres://cookify:cookify@localhost:5432/cookify?sslmode=disable",
    )


def schema_name() -> str:
    name = os.environ.get("ANALYTICS_SCHEMA", "catalog")
    if not name.replace("_", "").isalnum():
        raise ValueError("invalid ANALYTICS_SCHEMA")
    return name


def _adopt_snapp_schema(conn: Conn, schema: str) -> None:
    """Move the old snapp schema into the cookify catalog schema."""
    if schema != "catalog":
        return
    legacy = conn.execute(
        "SELECT 1 AS ok FROM information_schema.schemata WHERE schema_name = 'snapp'"
    ).fetchone()
    if not legacy:
        return
    catalog = conn.execute(
        "SELECT 1 AS ok FROM information_schema.schemata WHERE schema_name = 'catalog'"
    ).fetchone()
    if not catalog:
        conn.execute("ALTER SCHEMA snapp RENAME TO catalog")
        return
    conn.execute("CREATE SCHEMA IF NOT EXISTS catalog")
    conn.execute("SET search_path TO catalog")
    for table in ("products", "classify_queue", "snapp_brands", "snapp_categories", "snapp_subcategories"):
        exists = conn.execute(
            """
            SELECT 1 AS ok FROM information_schema.tables
            WHERE table_schema = 'catalog' AND table_name = %s
            """,
            (table,),
        ).fetchone()
        if exists:
            continue
        conn.execute(f"ALTER TABLE snapp.{table} SET SCHEMA catalog")


_catalog_ready = False
_catalog_ready_lock = threading.Lock()


def connect() -> Conn:
    raw = psycopg.connect(database_url(), row_factory=dict_row)
    conn = Conn(raw)
    schema = schema_name()
    _adopt_snapp_schema(conn, schema)
    conn.execute(f"CREATE SCHEMA IF NOT EXISTS {schema}")
    conn.execute(f"SET search_path TO {schema}")
    conn.executescript(SCHEMA)
    _migrate(conn)
    if schema == "catalog":
        global _catalog_ready
        with _catalog_ready_lock:
            if not _catalog_ready:
                _import_sqlite_if_empty(conn)
                _fill_taxonomy_from_slug(conn)
                _fill_app_products(conn)
                _catalog_ready = True
    conn.commit()
    return conn


def _fill_taxonomy_from_slug(conn: Conn) -> None:
    """Search rows often only have a subcategory slug. Copy Snapp ids from the category tree."""
    conn.execute(
        """
        UPDATE products AS p
        SET snapp_subcategory_id = c.id,
            snapp_subcategory_title = COALESCE(NULLIF(p.snapp_subcategory_title, ''), c.title),
            snapp_subcategory = COALESCE(NULLIF(p.snapp_subcategory, ''), c.title),
            snapp_category_id = COALESCE(NULLIF(p.snapp_category_id, ''), parent.id),
            snapp_category_title = COALESCE(NULLIF(p.snapp_category_title, ''), parent.title),
            snapp_category_slug = COALESCE(NULLIF(p.snapp_category_slug, ''), parent.slug)
        FROM snapp_categories AS c
        JOIN snapp_categories AS parent ON parent.id = c.parent_id
        WHERE c.slug IS NOT NULL AND c.slug <> ''
          AND c.slug = p.subcategory_slug
          AND (p.snapp_category_id IS NULL OR p.snapp_category_id = '')
        """
    )


def _fill_app_products(conn: Conn) -> None:
    """Copy category ids onto cookify public.products by the closest subcategory title."""
    subs = [
        dict(row)
        for row in conn.execute(
            """
            SELECT c.id, c.title, c.slug, parent.id AS parent_id, parent.title AS parent_title, parent.slug AS parent_slug
            FROM snapp_categories c
            JOIN snapp_categories parent ON parent.id = c.parent_id
            WHERE c.parent_id IS NOT NULL AND c.parent_id <> '99999999'
            """
        )
    ]
    keyed = [
        dict(row)
        for row in conn.execute(
            """
            SELECT ingredient_key, snapp_category_id, snapp_category_slug, snapp_category_title,
                   snapp_subcategory_id, subcategory_slug, snapp_subcategory_title
            FROM products
            WHERE ingredient_key IS NOT NULL AND ingredient_key <> ''
              AND snapp_category_id IS NOT NULL AND snapp_category_id <> ''
              AND snapp_subcategory_id IS NOT NULL AND snapp_subcategory_id <> ''
            """
        )
    ]
    apps = conn.execute(
        """
        SELECT id, title FROM public.products
        WHERE category_id IS NULL OR subcategory_id IS NULL
           OR category_slug IS NULL OR subcategory_slug IS NULL
        """
    ).fetchall()
    for product in apps:
        title = str(product["title"])
        best = None
        for needle, slug in (
            ("پاستا", "pasta-spaghetti"),
            ("ماکارون", "pasta-spaghetti"),
            ("جو پرک", "cereal"),
            ("کشمش", "dried-fruits-sweets"),
        ):
            if needle in title:
                best = next((sub for sub in subs if sub["slug"] == slug), None)
                break
        if best is not None:
            conn.execute(
                """
                UPDATE public.products
                SET category_id = %s,
                    category_slug = %s,
                    category_title = COALESCE(NULLIF(category_title, ''), %s),
                    subcategory_id = %s,
                    subcategory_slug = %s,
                    subcategory_title = COALESCE(NULLIF(subcategory_title, ''), %s)
                WHERE id = %s
                """,
                (
                    int(best["parent_id"]),
                    best["parent_slug"],
                    best["parent_title"],
                    int(best["id"]),
                    best["slug"],
                    best["title"],
                    product["id"],
                ),
            )
            continue
        best = None
        best_len = 0
        counts: dict[str, dict[str, Any]] = {}
        for row in keyed:
            key = str(row["ingredient_key"])
            if not key or key not in title or len(key) < best_len:
                continue
            if len(key) > best_len:
                counts = {}
                best_len = len(key)
            bucket = counts.setdefault(
                str(row["snapp_subcategory_id"]),
                {
                    "n": 0,
                    "key": key,
                    "parent_id": row["snapp_category_id"],
                    "parent_slug": row["snapp_category_slug"],
                    "parent_title": row["snapp_category_title"],
                    "id": row["snapp_subcategory_id"],
                    "slug": row["subcategory_slug"],
                    "title": row["snapp_subcategory_title"],
                },
            )
            bucket["n"] += 1
        if counts:
            best = max(
                counts.values(),
                key=lambda item: (
                    sum(1 for part in str(item["key"]).split() if part and part in str(item["title"] or "")),
                    item["n"],
                ),
            )
        if best is None:
            for sub in subs:
                name = str(sub["title"])
                if name and name in title and len(name) > best_len:
                    best, best_len = sub, len(name)
        if best is None:
            continue
        conn.execute(
            """
            UPDATE public.products
            SET category_id = %s,
                category_slug = %s,
                category_title = COALESCE(NULLIF(category_title, ''), %s),
                subcategory_id = %s,
                subcategory_slug = %s,
                subcategory_title = COALESCE(NULLIF(subcategory_title, ''), %s)
            WHERE id = %s
            """,
            (
                int(best["parent_id"]),
                best["parent_slug"],
                best["parent_title"],
                int(best["id"]),
                best["slug"],
                best["title"],
                product["id"],
            ),
        )


def _migrate(conn: Conn) -> None:
    cols = {
        row["column_name"]
        for row in conn.execute(
            """
            SELECT column_name FROM information_schema.columns
            WHERE table_schema = current_schema() AND table_name = 'products'
            """
        )
    }
    for name, ddl in (
        ("snapp_subcategory", "TEXT"),
        ("milliliters", "REAL"),
        ("price_per_100ml", "REAL"),
        ("price_per_piece", "REAL"),
        ("is_grocery", "INTEGER"),
        ("ingredient_key", "TEXT"),
        ("product_form", "TEXT"),
        ("llm_json", "TEXT"),
        ("classify_source", "TEXT"),
        ("snapp_category_id", "TEXT"),
        ("snapp_category_title", "TEXT"),
        ("snapp_category_slug", "TEXT"),
        ("snapp_subcategory_id", "TEXT"),
        ("snapp_subcategory_title", "TEXT"),
    ):
        if name not in cols:
            conn.execute(f"ALTER TABLE products ADD COLUMN {name} {ddl}")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_products_ingredient ON products(ingredient_key)")


def _import_sqlite_if_empty(conn: Conn) -> None:
    if not DB_PATH.exists():
        return
    if conn.execute("SELECT COUNT(*) AS n FROM products").fetchone()["n"]:
        return
    src = sqlite3.connect(DB_PATH)
    src.row_factory = sqlite3.Row
    try:
        for table in ("products", "classify_queue", "snapp_brands", "snapp_categories", "snapp_subcategories"):
            info = src.execute(f"PRAGMA table_info({table})").fetchall()
            if not info:
                continue
            cols = [row[1] for row in info]
            rows = src.execute(f"SELECT * FROM {table}").fetchall()
            if not rows:
                continue
            col_sql = ", ".join(cols)
            placeholders = ", ".join(["%s"] * len(cols))
            sql = f"INSERT INTO {table} ({col_sql}) VALUES ({placeholders}) ON CONFLICT DO NOTHING"
            with conn.raw.cursor() as cur:
                cur.executemany(sql, [tuple(row) for row in rows])
    finally:
        src.close()


def category_node_id(raw: Any) -> str:
    """Snapp sends a parent category id as a one-item list."""
    if isinstance(raw, list):
        raw = raw[0] if raw else ""
    return str(raw or "").strip()


def save_category_tree(payload: dict[str, Any]) -> int:
    """Store the express-search category tree with Snapp's own ids."""
    categories = payload.get("categories") or []
    real = [cat for cat in categories if category_node_id(cat.get("id")) != "99999999"]
    promo = [cat for cat in categories if category_node_id(cat.get("id")) == "99999999"]
    conn = connect()
    n = 0
    with conn:
        for cat in [*real, *promo]:
            parent_id = category_node_id(cat.get("id"))
            title = str(cat.get("title") or "").strip()
            slug = str(cat.get("slug") or "").strip()
            if not parent_id or not title:
                continue
            if parent_id != "99999999":
                conn.execute(
                    """
                    INSERT INTO snapp_categories (id, title, slug, parent_id)
                    VALUES (?, ?, ?, NULL)
                    ON CONFLICT(id) DO UPDATE SET title = excluded.title, slug = excluded.slug
                    """,
                    (parent_id, title, slug),
                )
                n += 1
            for sub in cat.get("sub_categories") or []:
                sub_id = category_node_id(sub.get("id"))
                sub_title = str(sub.get("title") or "").strip()
                sub_slug = str(sub.get("slug") or "").strip()
                if not sub_id or not sub_title:
                    continue
                if parent_id == "99999999":
                    conn.execute(
                        """
                        INSERT INTO snapp_categories (id, title, slug, parent_id)
                        VALUES (?, ?, ?, ?)
                        ON CONFLICT(id) DO NOTHING
                        """,
                        (sub_id, sub_title, sub_slug, parent_id),
                    )
                else:
                    conn.execute(
                        """
                        INSERT INTO snapp_categories (id, title, slug, parent_id)
                        VALUES (?, ?, ?, ?)
                        ON CONFLICT(id) DO UPDATE SET
                          title = excluded.title,
                          slug = excluded.slug,
                          parent_id = excluded.parent_id
                        """,
                        (sub_id, sub_title, sub_slug, parent_id),
                    )
                conn.execute(
                    """
                    INSERT INTO snapp_subcategories (id, name)
                    VALUES (?, ?)
                    ON CONFLICT(id) DO UPDATE SET name = excluded.name
                    """,
                    (sub_id, sub_title),
                )
                n += 1
    conn.close()
    return n


def remember_snapp_taxonomy(conn: Conn, item: dict[str, Any]) -> None:
    """Store Snapp category and subcategory rows."""
    category_id = str(item.get("category_id") or "").strip()
    category_title = str(item.get("category_title") or "").strip()
    category_slug = str(item.get("category_slug") or "").strip()
    subcategory_id = str(item.get("subcategory_id") or "").strip()
    subcategory_title = str(item.get("subcategory_title") or "").strip()
    subcategory_slug = str(item.get("subcategory_slug") or "").strip()
    if category_id and category_title:
        conn.execute(
            """
            INSERT INTO snapp_categories (id, title, slug, parent_id)
            VALUES (?, ?, ?, NULL)
            ON CONFLICT(id) DO UPDATE SET title = excluded.title, slug = excluded.slug
            """,
            (category_id, category_title, category_slug),
        )
    if subcategory_id and subcategory_title:
        conn.execute(
            """
            INSERT INTO snapp_categories (id, title, slug, parent_id)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              title = excluded.title,
              slug = excluded.slug,
              parent_id = excluded.parent_id
            """,
            (subcategory_id, subcategory_title, subcategory_slug, category_id or None),
        )
    if subcategory_id and subcategory_title:
        conn.execute(
            """
            INSERT INTO snapp_subcategories (id, name)
            VALUES (?, ?)
            ON CONFLICT(id) DO UPDATE SET name = excluded.name
            """,
            (subcategory_id, subcategory_title),
        )


def upsert_taxonomy(filters: dict[str, Any] | None) -> None:
    if not filters:
        return
    conn = connect()
    with conn:
        for brand in filters.get("brands_info") or []:
            bid = str(brand.get("id") or "")
            name = (brand.get("name") or "").strip()
            if bid and name:
                conn.execute(
                    "INSERT INTO snapp_brands(id, name) VALUES(?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name",
                    (bid, name),
                )
        for cat in filters.get("sub_cats_info") or []:
            ids = cat.get("id") or []
            if not isinstance(ids, list):
                ids = [ids]
            name = (cat.get("name") or "").strip()
            for cid in ids:
                key = str(cid)
                if key and name:
                    conn.execute(
                        "INSERT INTO snapp_subcategories(id, name) VALUES(?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name",
                        (key, name),
                    )
    conn.close()


def taxonomy() -> dict[str, list[dict[str, str]]]:
    conn = connect()
    brands = [dict(r) for r in conn.execute("SELECT id, name FROM snapp_brands ORDER BY name")]
    cats = [dict(r) for r in conn.execute("SELECT id, name FROM snapp_subcategories ORDER BY name")]
    conn.close()
    return {"brands": brands, "subcategories": cats}


def upsert_raw(rows: Iterable[dict[str, Any]]) -> int:
    now = datetime.now(timezone.utc).isoformat()
    conn = connect()
    n = 0
    with conn:
        for row in rows:
            item = row.get("item") or {}
            pid = str(row.get("snapp_id") or item.get("id") or "")
            if not pid:
                continue
            existing = conn.execute(
                "SELECT query_hits FROM products WHERE snapp_id = ?", (pid,)
            ).fetchone()
            hits: list[str] = []
            if existing and existing["query_hits"]:
                try:
                    hits = json.loads(existing["query_hits"])
                except json.JSONDecodeError:
                    hits = []
            q = row.get("query")
            if q and q not in hits:
                hits.append(q)
            conn.execute(
                """
                INSERT INTO products (
                  snapp_id, document_id, title, query_hits, raw_json, fetched_at,
                  subcategory_slug, category,
                  snapp_category_id, snapp_category_title, snapp_category_slug,
                  snapp_subcategory_id, snapp_subcategory_title, snapp_subcategory
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(snapp_id) DO UPDATE SET
                  document_id = excluded.document_id,
                  title = excluded.title,
                  query_hits = excluded.query_hits,
                  raw_json = excluded.raw_json,
                  fetched_at = excluded.fetched_at,
                  subcategory_slug = COALESCE(excluded.subcategory_slug, products.subcategory_slug),
                  category = CASE
                    WHEN excluded.category != '' THEN excluded.category
                    ELSE products.category
                  END,
                  snapp_category_id = COALESCE(excluded.snapp_category_id, products.snapp_category_id),
                  snapp_category_title = COALESCE(excluded.snapp_category_title, products.snapp_category_title),
                  snapp_category_slug = COALESCE(excluded.snapp_category_slug, products.snapp_category_slug),
                  snapp_subcategory_id = COALESCE(excluded.snapp_subcategory_id, products.snapp_subcategory_id),
                  snapp_subcategory_title = COALESCE(excluded.snapp_subcategory_title, products.snapp_subcategory_title),
                  snapp_subcategory = COALESCE(excluded.snapp_subcategory, products.snapp_subcategory)
                """,
                (
                    pid,
                    row.get("document_id") or item.get("document_id"),
                    item.get("title") or "",
                    json.dumps(hits, ensure_ascii=False),
                    json.dumps(item, ensure_ascii=False),
                    now,
                    str(item.get("subcategory_slug") or "") or None,
                    str(item.get("category_title") or ""),
                    str(item.get("category_id") or "") or None,
                    str(item.get("category_title") or "") or None,
                    str(item.get("category_slug") or "") or None,
                    str(item.get("subcategory_id") or "") or None,
                    str(item.get("subcategory_title") or "") or None,
                    str(item.get("subcategory_title") or "") or None,
                ),
            )
            remember_snapp_taxonomy(conn, item)
            n += 1
    conn.close()
    return n


def classify_saved(snapp_id: str) -> dict[str, Any] | None:
    from snapp_analytics.classify import classify_title

    conn = connect()
    row = conn.execute(
        "SELECT snapp_id, document_id, query_hits, raw_json FROM products WHERE snapp_id = ?",
        (snapp_id,),
    ).fetchone()
    if row is None:
        conn.close()
        return None
    now = datetime.now(timezone.utc).isoformat()
    item = {}
    if row["raw_json"]:
        try:
            item = json.loads(row["raw_json"])
        except json.JSONDecodeError:
            item = {}
    hits = []
    if row["query_hits"]:
        try:
            hits = json.loads(row["query_hits"])
        except json.JSONDecodeError:
            hits = []
    parsed = preprocess_item(
        {
            "snapp_id": row["snapp_id"],
            "document_id": row["document_id"],
            "query": hits[0] if hits else "",
            "item": item,
        }
    )
    tagged = classify_title(parsed["title"], parsed["subcategory_slug"], use_llm=False)
    if tagged["is_grocery"] is False:
        parsed["is_grocery"] = 0
        parsed["ingredient_key"] = ""
        parsed["category"] = "غیرخوراکی"
    else:
        parsed["is_grocery"] = 1
        if tagged.get("ingredient_key"):
            parsed["ingredient_key"] = tagged["ingredient_key"]
        if tagged.get("category_fa") and not parsed.get("snapp_category_title"):
            parsed["category"] = tagged["category_fa"]
    parsed["product_form"] = tagged.get("form") or ""
    parsed["classify_source"] = tagged.get("source") or "rule"
    entity = norm_text(str(item.get("product_entity") or ""))
    if entity and tagged.get("is_grocery") is not False and tagged.get("source") != "rule":
        parsed["ingredient_key"] = entity
    if parsed.get("snapp_category_title") or entity:
        parsed["classify_source"] = "snapp"
    parsed["llm_json"] = json.dumps(tagged.get("llm") or {}, ensure_ascii=False)
    with conn:
        conn.execute(
            """
            UPDATE products SET
              title = ?, title_norm = ?, price = ?, discount = ?, discount_ratio = ?,
              price_final = ?, image_url = ?, subcategory_slug = ?, category = ?,
              snapp_category_id = ?, snapp_category_title = ?, snapp_category_slug = ?,
              snapp_subcategory_id = ?, snapp_subcategory_title = ?, snapp_subcategory = ?,
              brand = ?, amount_value = ?, amount_unit = ?, grams = ?, milliliters = ?,
              price_per_100g = ?, price_per_100ml = ?, price_per_piece = ?,
              is_grocery = ?, ingredient_key = ?, product_form = ?, llm_json = ?,
              classify_source = ?, tokens = ?, preprocessed_at = ?
            WHERE snapp_id = ?
            """,
            (
                parsed["title"],
                parsed["title_norm"],
                parsed["price"],
                parsed["discount"],
                parsed["discount_ratio"],
                parsed["price_final"],
                parsed["image_url"],
                parsed["subcategory_slug"],
                parsed["category"],
                parsed.get("snapp_category_id") or None,
                parsed.get("snapp_category_title") or None,
                parsed.get("snapp_category_slug") or None,
                parsed.get("snapp_subcategory_id") or None,
                parsed.get("snapp_subcategory_title") or None,
                parsed.get("snapp_subcategory") or None,
                parsed["brand"],
                parsed["amount_value"],
                parsed["amount_unit"],
                parsed["grams"],
                parsed["milliliters"],
                parsed["price_per_100g"],
                parsed["price_per_100ml"],
                parsed["price_per_piece"],
                parsed["is_grocery"],
                parsed["ingredient_key"],
                parsed["product_form"],
                parsed["llm_json"],
                parsed["classify_source"],
                parsed["tokens"],
                now,
                row["snapp_id"],
            ),
        )
    conn.close()
    return tagged


def preprocess_all(limit: int | None = None) -> int:
    conn = connect()
    sql = "SELECT snapp_id FROM products"
    if limit:
        sql += f" LIMIT {int(limit)}"
    ids = [r["snapp_id"] for r in conn.execute(sql).fetchall()]
    conn.close()
    n = 0
    for snapp_id in ids:
        if classify_saved(snapp_id) is not None:
            n += 1
    return n


def list_products(
    category: str | None = None,
    q: str | None = None,
    ingredient: str | None = None,
    grocery_only: bool = False,
    limit: int = 50,
) -> list[dict[str, Any]]:
    conn = connect()
    sql = "SELECT * FROM products WHERE 1=1"
    args: list[Any] = []
    if category:
        sql += " AND category = ?"
        args.append(category)
    if ingredient:
        sql += " AND ingredient_key = ?"
        args.append(ingredient)
    if grocery_only:
        sql += " AND COALESCE(is_grocery, 1) = 1 AND COALESCE(category, '') != 'غیرخوراکی'"
    if q:
        sql += " AND (title LIKE ? OR tokens LIKE ? OR brand LIKE ?)"
        like = f"%{q}%"
        args.extend([like, like, like])
    sql += " ORDER BY price_final IS NULL, price_final LIMIT ?"
    args.append(limit)
    out = [dict(r) for r in conn.execute(sql, args).fetchall()]
    conn.close()
    return out


def to_dataframe():
    import pandas as pd

    conn = connect()
    rows = conn.execute("SELECT * FROM products").fetchall()
    conn.close()
    return pd.DataFrame(rows)


def export_parquet() -> str:
    df = to_dataframe()
    ensure_dirs()
    df.to_parquet(PARQUET_PATH, index=False)
    return str(PARQUET_PATH)
