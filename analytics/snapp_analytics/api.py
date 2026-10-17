from __future__ import annotations

import json
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator

from snapp_analytics.analyze import estimate_cost, match_name, pick_catalog_products, record_choice, stats
from snapp_analytics.client import SnappClient
from snapp_analytics.paths import QUERIES_PATH
from snapp_analytics.queue import enqueue_items, queue_stats, start_worker
from snapp_analytics.store import (
    export_parquet,
    list_products,
    preprocess_all,
    save_category_tree,
    upsert_raw,
    upsert_taxonomy,
)


@asynccontextmanager
async def _lifespan(_: FastAPI):
    try:
        client = SnappClient(pause=0)
        try:
            save_category_tree(client.categories())
        finally:
            client.close()
    except Exception:
        pass
    start_worker()
    yield


app = FastAPI(
    title="Cookify Snapp Analytics",
    description="صف دسته‌بندی محصولات اسنپ‌مارکت",
    version="0.1.0",
    lifespan=_lifespan,
)


class EstimateBody(BaseModel):
    name: str
    amount: float = Field(gt=0)
    unit: str = "گرم"


class IngestBody(BaseModel):
    queries: list[str] | None = None
    max_pages: int = Field(default=5, ge=1, le=30)
    size: int = Field(default=20, ge=1, le=20)


class ClassifyBody(BaseModel):
    limit: int | None = Field(default=None, ge=1, le=500)


class MatchBody(BaseModel):
    name: str
    limit: int = Field(default=8, ge=1, le=30)


class CatalogBody(BaseModel):
    names: list[str] = Field(default_factory=list, max_length=40)


class QueueItem(BaseModel):
    snapp_id: str
    title: str
    price: int = 0
    discount: int = 0
    subcategory_slug: str = ""
    subcategory_id: str = ""
    subcategory_title: str = ""
    category_id: str = ""
    category_title: str = ""
    category_slug: str = ""
    image: str = ""
    query: str = ""
    product_entity: str = ""

    @field_validator("category_id", "subcategory_id", mode="before")
    @classmethod
    def ids_as_text(cls, value: object) -> str:
        if value is None:
            return ""
        return str(value).strip()


class QueueBody(BaseModel):
    items: list[QueueItem]


def _default_queries() -> list[str]:
    return json.loads(QUERIES_PATH.read_text(encoding="utf-8"))


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/queue")
def queue_items(body: QueueBody) -> dict[str, int]:
    return enqueue_items([item.model_dump() for item in body.items])


@app.get("/queue")
def queue_state() -> dict[str, int]:
    return queue_stats()


@app.post("/ingest")
def ingest(body: IngestBody) -> dict[str, Any]:
    queries = body.queries or _default_queries()
    client = SnappClient()
    saved = 0
    try:
        for q in queries:
            rows = client.crawl(q, max_pages=body.max_pages, size=body.size)
            if rows:
                upsert_taxonomy(rows[0].get("filters"))
            saved += upsert_raw(rows)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    finally:
        client.close()
    processed = preprocess_all()
    return {"queries": len(queries), "upserts": saved, "preprocessed": processed}


@app.post("/preprocess")
def preprocess() -> dict[str, int]:
    return {"preprocessed": preprocess_all()}


@app.post("/classify")
def classify(body: ClassifyBody | None = None) -> dict[str, Any]:
    body = body or ClassifyBody()
    n = preprocess_all(limit=body.limit)
    return {"classified": n, "source": "snapp"}


@app.post("/export")
def export_file() -> dict[str, str]:
    return {"path": export_parquet()}


@app.get("/products")
def products(
    category: str | None = None,
    q: str | None = None,
    ingredient: str | None = None,
    grocery_only: bool = False,
    limit: int = 50,
) -> list[dict[str, Any]]:
    return list_products(
        category=category,
        q=q,
        ingredient=ingredient,
        grocery_only=grocery_only,
        limit=min(limit, 200),
    )


@app.get("/stats")
def get_stats() -> dict[str, Any]:
    return stats()


class ChoiceBody(BaseModel):
    ingredient: str
    product_id: str


@app.post("/catalog/choice")
def catalog_choice(body: ChoiceBody) -> dict[str, str]:
    record_choice(body.ingredient, body.product_id)
    return {"status": "ok"}


@app.post("/catalog/match")
def catalog_match(body: CatalogBody) -> list[dict[str, Any]]:
    found = []
    for name in body.names:
        found.extend(pick_catalog_products(name, limit=5))
    return found


@app.post("/match")
def match(body: MatchBody) -> list[dict[str, Any]]:
    return match_name(body.name, limit=body.limit)


@app.post("/estimate")
def estimate(body: EstimateBody) -> dict[str, Any]:
    return estimate_cost(body.name, body.amount, body.unit)
