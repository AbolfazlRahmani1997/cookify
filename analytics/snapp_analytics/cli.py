from __future__ import annotations

import argparse
import json

from snapp_analytics.analyze import estimate_cost, stats
from snapp_analytics.client import SnappClient
from snapp_analytics.paths import QUERIES_PATH
from snapp_analytics.store import export_parquet, preprocess_all, upsert_raw, upsert_taxonomy


def load_queries(extra: list[str] | None = None) -> list[str]:
    base = json.loads(QUERIES_PATH.read_text(encoding="utf-8"))
    if extra:
        return list(dict.fromkeys([*extra, *base]))
    return base


def cmd_ingest(args: argparse.Namespace) -> None:
    queries = load_queries(args.query)
    client = SnappClient()
    total = 0
    try:
        for q in queries:
            print(f"crawl {q} …")
            rows = client.crawl(q, max_pages=args.pages, size=args.size)
            if rows:
                upsert_taxonomy(rows[0].get("filters"))
            n = upsert_raw(rows)
            total += n
            print(f"  {len(rows)} raw / {n} upsert")
    finally:
        client.close()
    processed = preprocess_all()
    print(f"done. upserts={total} preprocessed={processed}")


def cmd_preprocess(args: argparse.Namespace) -> None:
    print(f"preprocessed={preprocess_all(limit=args.limit)}")


def cmd_classify(args: argparse.Namespace) -> None:
    print(f"classified={preprocess_all(limit=args.limit)}")


def cmd_stats(_: argparse.Namespace) -> None:
    print(json.dumps(stats(), ensure_ascii=False, indent=2))


def cmd_export(_: argparse.Namespace) -> None:
    print(export_parquet())


def cmd_estimate(args: argparse.Namespace) -> None:
    print(json.dumps(estimate_cost(args.name, args.amount, args.unit), ensure_ascii=False, indent=2))


def cmd_serve(args: argparse.Namespace) -> None:
    import uvicorn

    uvicorn.run(
        "snapp_analytics.api:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="دیتاست و تحلیل اسنپ‌مارکت")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_in = sub.add_parser("ingest", help="جمع‌آوری از اسنپ‌مارکت")
    p_in.add_argument("--pages", type=int, default=5)
    p_in.add_argument("--size", type=int, default=20)
    p_in.add_argument("--query", action="append", default=[])
    p_in.set_defaults(func=cmd_ingest)

    p_pre = sub.add_parser("preprocess", help="دسته‌بندی و نرمال‌سازی")
    p_pre.add_argument("--limit", type=int, default=None)
    p_pre.set_defaults(func=cmd_preprocess)

    p_c = sub.add_parser("classify", help="دسته‌بندی با دسته و زیردسته اسنپ")
    p_c.add_argument("--limit", type=int, default=None)
    p_c.set_defaults(func=cmd_classify)
    sub.add_parser("stats", help="خلاصه دیتاست").set_defaults(func=cmd_stats)
    sub.add_parser("export", help="خروجی parquet").set_defaults(func=cmd_export)

    p_e = sub.add_parser("estimate", help="تخمین هزینه ماده با قیمت واحد بسته‌ها")
    p_e.add_argument("name")
    p_e.add_argument("--amount", type=float, required=True)
    p_e.add_argument("--unit", default="گرم")
    p_e.set_defaults(func=cmd_estimate)

    p_s = sub.add_parser("serve", help="API تحلیل روی پورت 8090")
    p_s.add_argument("--host", default="127.0.0.1")
    p_s.add_argument("--port", type=int, default=8090)
    p_s.add_argument("--reload", action="store_true")
    p_s.set_defaults(func=cmd_serve)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
