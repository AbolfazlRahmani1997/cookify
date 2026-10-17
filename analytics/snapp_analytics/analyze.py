from __future__ import annotations

from collections import Counter
from typing import Any

from snapp_analytics.preprocess import canonical_ingredient, requested_to_base
from snapp_analytics.store import connect, to_dataframe


def stats() -> dict[str, Any]:
    conn = connect()
    total = conn.execute("SELECT COUNT(*) FROM products").fetchone()[0]
    priced = conn.execute(
        "SELECT COUNT(*) FROM products WHERE price_final IS NOT NULL AND price_final > 0"
    ).fetchone()[0]
    cats = [
        {"category": r["category"] or "سایر", "count": r["n"]}
        for r in conn.execute(
            "SELECT category, COUNT(*) n FROM products GROUP BY category ORDER BY n DESC"
        )
    ]
    brands = [
        {"brand": r["brand"] or "نامشخص", "count": r["n"]}
        for r in conn.execute(
            """
            SELECT brand, COUNT(*) n FROM products
            WHERE brand IS NOT NULL AND brand != ''
            GROUP BY brand ORDER BY n DESC LIMIT 20
            """
        )
    ]
    price = conn.execute(
        """
        SELECT
          MIN(price_final) min_price,
          MAX(price_final) max_price,
          AVG(price_final) avg_price,
          AVG(discount_ratio) avg_discount
        FROM products WHERE price_final > 0
        """
    ).fetchone()
    grocery = conn.execute(
        "SELECT COUNT(*) FROM products WHERE COALESCE(is_grocery, 1) = 1 AND COALESCE(category,'') != 'غیرخوراکی'"
    ).fetchone()[0]
    ingredients = [
        {
            "ingredient": r["ingredient_key"],
            "packs": r["n"],
            "avg_per_100g": round(r["med"], 1) if r["med"] is not None else None,
        }
        for r in conn.execute(
            """
            SELECT ingredient_key, COUNT(*) n, AVG(price_per_100g) med
            FROM products
            WHERE COALESCE(is_grocery, 1) = 1
              AND ingredient_key IS NOT NULL AND ingredient_key != ''
              AND price_per_100g IS NOT NULL
            GROUP BY ingredient_key
            ORDER BY n DESC
            LIMIT 40
            """
        )
    ]
    conn.close()
    return {
        "total": total,
        "with_price": priced,
        "grocery": grocery,
        "by_category": cats,
        "by_ingredient": ingredients,
        "top_brands": brands,
        "price": {
            "min": price["min_price"] if price else None,
            "max": price["max_price"] if price else None,
            "avg": round(price["avg_price"], 1) if price and price["avg_price"] else None,
            "avg_discount_ratio": round(price["avg_discount"], 2)
            if price and price["avg_discount"]
            else 0,
        },
    }


_NON_GROCERY = (
    "شامپو",
    "شوینده",
    "ظرفشویی",
    "لباسشویی",
    "صابون",
    "لوسیون",
    "اسپری بدن",
    "شامپو بدن",
    "مایع دستشویی",
    "خمیردندان",
    "پوشک",
    "غذای سگ",
    "غذای گربه",
)

_ALIASES = {
    "نمک": "نمک خوراکی",
    "فلفل": "فلفل سیاه",
    "شکر": "شکر سفید",
    "روغن": "روغن مایع",
    "آرد": "آرد سفید",
    "رب": "رب گوجه",
    "پارمزان": "پنیر پارمزان",
    "پنیر پارمزان": "پنیر پارمزان",
}

_GENERIC = {"و", "با", "از", "برای", "مقدار", "لازم"}


def _specific_tokens(text: str) -> list[str]:
    return [t for t in text.replace("‌", " ").split() if t not in _GENERIC and len(t) >= 3]


def _token_in_title(tok: str, title: str) -> bool:
    if tok in {"پارمزان", "پارمسان", "parmesan"}:
        return any(x in title.lower() for x in ("پارمزان", "پارمسان", "parmesan"))
    return tok in title


def choose_subcategory(name: str, rows: list[dict[str, Any]]) -> dict[str, Any] | None:
    """Pick the Snapp subcategory whose title best fits the ingredient."""
    canon = canonical_ingredient(name)
    needle = name.strip()
    best: dict[str, Any] | None = None
    best_score = 0
    for row in rows:
        title = str(row.get("title") or "").strip()
        if not title:
            continue
        score = 0
        if title in (canon, needle):
            score = 200
        elif canon and canon in title:
            score = 100 + len(canon)
        elif title in canon.split():
            score = 40 + len(title)
        if score > best_score:
            best, best_score = row, score
    return best


_SYNONYMS = {
    "گندم": ("گندم", "سفید", "نول"),
    "پارمزان": ("پارمزان", "پارمسان", "parmesan"),
    "تست": ("تست", "توست"),
}

# A prepared form in the product title is a different ingredient unless the recipe asked for it.
_PREPARED = (
    "سرخ شده",
    "مربا",
    "منجمد",
    "کاکائو",
    "قهوه ای",
    "قهوه‌ای",
    "کوکتل",
    "سوسیس",
    "پیراشکی",
    "زیتون",
    "نعناع",
    "نعنایی",
    "چیپس",
    "کنسرو",
    "خلال",
    "ماسالا",
    "کاکایو",
    "عسلی",
    "بذر",
    "تنوری",
    "بستنی",
    "اسنک",
    "داغ",
    "خشک",
    "سویق",
    "سس",
)


def _covers(token: str, text: str) -> bool:
    if token in text:
        return True
    return any(alt in text for alt in _SYNONYMS.get(token, ()))


def catalog_score(name: str, row: dict[str, Any]) -> int:
    """Rank a stored product for a recipe ingredient using Snapp categories."""
    title = str(row.get("title") or "")
    key = str(row.get("ingredient_key") or "")
    if row.get("is_grocery") == 0:
        return -100
    processed = ("شنسل", "شنیسل", "ناگت", "سوخاری", "کنسرو", "ساندویچ")
    if "سینه" in name and any(word in title or word in key for word in processed):
        return -100
    canon = canonical_ingredient(name)
    titled = canonical_ingredient(title)
    if key and canon and key != canon:
        return -100
    if titled and canon and titled != canon:
        return -100
    blob = f"{title} {key}"
    if any(form in blob and form not in name for form in _PREPARED):
        return -100
    if blob.startswith("آب") and not name.startswith("آب"):
        return -100
    if canon == "پنیر" and any(kind in blob for kind in ("پیتزا", "موزارلا", "پارمزان", "پارمسان", "فتا", "لیقوان")):
        return -100
    if not all(_covers(tok, blob) for tok in _specific_tokens(canon or name)):
        return -100
    if not key and canon and canon not in title:
        return -100
    score = 0
    if key and key == canon:
        score += 50
    elif canon and canon in title:
        score += 30
    sub = str(row.get("snapp_subcategory_title") or "")
    if sub and sub in (canon, name.strip()):
        score += 20
    if str(row.get("snapp_category_id") or "").strip():
        score += 15
    if str(row.get("snapp_subcategory_id") or "").strip():
        score += 10
    return score


def pick_catalog_products(name: str, limit: int = 5) -> list[dict[str, Any]]:
    needle = name.strip()
    if not needle:
        return []
    conn = connect()
    subcategories = [
        dict(row)
        for row in conn.execute(
            """
            SELECT id, title, slug, parent_id FROM snapp_categories
            WHERE parent_id IS NOT NULL AND parent_id != '99999999'
            """
        )
    ]
    expected = choose_subcategory(needle, subcategories)
    rows = [
        dict(row)
        for row in conn.execute(
            """
            SELECT snapp_id, title, brand, price, discount, image_url, subcategory_slug,
                   snapp_category_id, snapp_category_title, snapp_category_slug,
                   snapp_subcategory_id, snapp_subcategory_title, ingredient_key,
                   is_grocery, amount_value, amount_unit, price_final
            FROM products
            WHERE COALESCE(is_grocery, 1) = 1
            """
        )
    ]
    conn.close()
    expected_id = str(expected["id"]) if expected else ""
    learned = choice_boosts(needle)
    ranked: list[tuple[int, dict[str, Any]]] = []
    for row in rows:
        score = catalog_score(needle, row)
        sub_id = str(row.get("snapp_subcategory_id") or "")
        if expected_id and sub_id and sub_id != expected_id:
            continue
        if expected_id and sub_id == expected_id:
            score += 25
        score += min(int(learned.get(str(row.get("snapp_id") or ""), 0)) * 20, 80)
        if score <= 0:
            continue
        ranked.append((score, row))
    ranked.sort(key=lambda item: item[0], reverse=True)
    out = []
    for score, row in ranked[:limit]:
        hit = dict(row)
        hit["score"] = score
        hit["query"] = needle
        out.append(hit)
    return out


def pick_catalog_product(name: str) -> dict[str, Any] | None:
    hits = pick_catalog_products(name, limit=1)
    return hits[0] if hits else None


def choice_boosts(name: str) -> dict[str, int]:
    needle = name.strip()
    if not needle:
        return {}
    conn = connect()
    rows = conn.execute(
        "SELECT snapp_id, picks FROM match_choices WHERE ingredient = ?",
        (needle,),
    ).fetchall()
    conn.close()
    return {str(row["snapp_id"]): int(row["picks"]) for row in rows}


def record_choice(ingredient: str, snapp_id: str) -> None:
    ingredient = ingredient.strip()
    snapp_id = str(snapp_id).removeprefix("sm-").strip()
    if not ingredient or not snapp_id:
        return
    conn = connect()
    conn.execute(
        """
        INSERT INTO match_choices (ingredient, snapp_id, picks)
        VALUES (?, ?, 1)
        ON CONFLICT (ingredient, snapp_id) DO UPDATE SET picks = match_choices.picks + 1
        """,
        (ingredient, snapp_id),
    )
    conn.commit()
    conn.close()


def match_name(name: str, limit: int = 8) -> list[dict[str, Any]]:
    """Local grocery-aware ranking (not first substring hit)."""
    df = to_dataframe()
    if df.empty or not name.strip():
        return []
    needle = name.strip()
    alias = _ALIASES.get(needle, needle)
    score = Counter()
    for _, row in df.iterrows():
        title = str(row.get("title") or "")
        tokens = str(row.get("tokens") or "")
        hits = str(row.get("query_hits") or "")
        cat = str(row.get("category") or "") + " " + str(row.get("snapp_subcategory") or "")
        if row.get("is_grocery") == 0 or any(bad in title for bad in _NON_GROCERY):
            continue
        need = set(_specific_tokens(needle) + _specific_tokens(alias))
        if need and not all(_token_in_title(tok, title) for tok in need):
            continue
        if "فتا" in title and any(x in needle + alias for x in ("پارمزان", "پارمسان", "parmesan")):
            continue
        if "سینه" in needle and any(
            x in title for x in ("شنسل", "شنیسل", "ناگت", "سوخاری", "کنسرو", "ساندویچ")
        ):
            continue
        key = str(row.get("ingredient_key") or "")
        s = 0
        if key and key in (needle, alias):
            s += 12
        if alias in title or needle in title:
            s += 5
        if title.startswith(needle) or title.startswith(alias):
            s += 8
        if needle in tokens or alias in tokens:
            s += 3
        if needle in hits or alias in hits:
            s += 4
        if needle in ("نمک", "شکر", "آرد", "برنج") and ("میلی لیتر" in title or "میلی‌لیتر" in title):
            s -= 8
        if "personal" in cat or "hygiene" in cat or "shampoo" in cat:
            s -= 10
        if s > 0:
            score[str(row["snapp_id"])] = s
    ranked = score.most_common(limit)
    by_id = {str(r["snapp_id"]): r for _, r in df.iterrows()}
    out = []
    for pid, s in ranked:
        rec = dict(by_id[pid])
        rec["score"] = s
        out.append(rec)
    return out


def _median(values: list[float]) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    mid = len(ordered) // 2
    if len(ordered) % 2:
        return float(ordered[mid])
    return (ordered[mid - 1] + ordered[mid]) / 2


def estimate_from_packs(
    packs: list[dict[str, Any]],
    amount: float,
    unit: str = "گرم",
    ingredient: str = "",
) -> dict[str, Any]:
    qty, basis = requested_to_base(amount, unit)
    rates: list[float] = []
    shown: list[dict[str, Any]] = []
    for p in packs:
        if p.get("is_grocery") == 0:
            continue
        rate = None
        if basis == "g" and p.get("price_per_100g"):
            rate = float(p["price_per_100g"])
        elif basis == "ml" and p.get("price_per_100ml"):
            rate = float(p["price_per_100ml"])
        elif basis == "piece" and p.get("price_per_piece"):
            rate = float(p["price_per_piece"])
        if rate is None or rate <= 0:
            continue
        rates.append(rate)
        shown.append(
            {
                "title": p.get("title"),
                "pack": f"{p.get('amount_value') or ''} {p.get('amount_unit') or ''}".strip(),
                "price": p.get("price_final"),
                "unit_price": rate,
            }
        )
    med = _median(rates)
    if med is None or qty is None:
        return {
            "ingredient": ingredient,
            "requested": {"amount": amount, "unit": unit},
            "estimated_toman": None,
            "packs": shown,
            "reason": "بستهٔ خوراکی با وزن/حجم قابل مقایسه پیدا نشد",
        }
    if basis == "piece":
        cost = med * qty
        unit_label = "هر عدد"
    else:
        cost = med * (qty / 100.0)
        unit_label = "هر ۱۰۰ گرم" if basis == "g" else "هر ۱۰۰ میلی‌لیتر"
    shown.sort(key=lambda x: x.get("price") or 0)
    return {
        "ingredient": ingredient,
        "requested": {"amount": amount, "unit": unit, "normalized": qty, "basis": basis},
        "unit_rate": {"median": round(med, 1), "label": unit_label, "samples": len(rates)},
        "estimated_toman": int(round(cost)),
        "pack_prices": shown[:12],
    }


def estimate_cost(name: str, amount: float, unit: str = "گرم") -> dict[str, Any]:
    key = canonical_ingredient(name)
    conn = connect()
    packs = [
        dict(r)
        for r in conn.execute(
            """
            SELECT title, amount_value, amount_unit, grams, milliliters, is_grocery,
                   price_final, price_per_100g, price_per_100ml, price_per_piece, brand
            FROM products
            WHERE COALESCE(is_grocery, 1) = 1
              AND ingredient_key = ?
              AND price_final > 0
            """,
            (key,),
        )
    ]
    conn.close()
    return estimate_from_packs(packs, amount, unit, ingredient=key)

