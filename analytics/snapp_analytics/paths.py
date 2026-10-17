from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
RAW_DIR = DATA / "raw"
DB_PATH = DATA / "snapp.sqlite"
QUERIES_PATH = ROOT / "queries.json"
PARQUET_PATH = DATA / "products.parquet"


def ensure_dirs() -> None:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    DATA.mkdir(parents=True, exist_ok=True)
