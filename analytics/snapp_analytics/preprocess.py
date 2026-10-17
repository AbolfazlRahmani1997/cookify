from __future__ import annotations

import re
from typing import Any

ARABIC_YE = str.maketrans({"ي": "ی", "ك": "ک", "ة": "ه"})

UNIT_RE = re.compile(
    r"(?P<n>\d+(?:[./]\d+)?)\s*(?P<u>گرم(?:ی)?|کیلو(?:گرم)?|میلی[\u200c\s]?لیتر|لیتر|عدد|بسته)",
    re.IGNORECASE,
)

NON_GROCERY_RE = re.compile(
    r"شامپو|شوینده|ظرفشویی|لباسشویی|نرم.?کننده|صابون|خمیردندان|لوسیون|"
    r"دئودورانت|ادکلن|عطر|پوشک|نوار بهداشتی|غذای سگ|غذای گربه|حیوانات|"
    r"سفیدکننده|جرم.?گیر|دستمال مرطوب|پاک.?کننده|اسکراب بدن|کره بدن|"
    r"اسپری بدن|ژل شستشو|مایع دستشویی|ضدعفونی|آرایش",
)

BRANDS = [
    "کاله",
    "مهیا پروتئین",
    "پمینا",
    "هراز",
    "میهن",
    "پگاه",
    "صباح",
    "رامک",
    "ب.آ",
    "بی تا",
    "بیتا",
    "هایپراستار",
    "سمین",
    "گلتاج",
    "تک ماکارون",
    "زر ماکارون",
    "گلستان",
    "نامی نو",
    "الیت",
    "کامپوره",
    "طلوع",
    "صحت",
    "گلها",
]

SLUG_CATEGORY = {
    "chicken": "پروتئین",
    "meat": "پروتئین",
    "fish": "پروتئین",
    "egg": "پروتئین",
    "dairy": "لبنیات",
    "milk": "لبنیات",
    "cheese": "لبنیات",
    "butter": "لبنیات",
    "rice": "غلات",
    "pasta": "غلات",
    "flour": "غلات",
    "bread": "نان",
    "oil": "روغن",
    "spice": "ادویه",
    "saffron": "ادویه",
    "vegetable": "سبزیجات",
    "mushroom": "سبزیجات",
    "fruit": "میوه",
    "frozen": "منجمد",
    "sausage": "پروتئین",
    "beverage": "نوشیدنی",
    "canned": "کنسرو",
    "legume": "حبوبات",
    "nut": "خشکبار",
    "sweet": "شیرینی",
}

KEYWORD_CATEGORY = [
    (r"مرغ|گوشت|ماهی|میگو|تخم.?مرغ|سوسیس|کالباس", "پروتئین"),
    (r"شیر|ماست|پنیر|کره|خامه", "لبنیات"),
    (r"برنج|آرد|ماکارون|پاستا|رشته", "غلات"),
    (r"نان|لواش|بربری|سنگک", "نان"),
    (r"روغن", "روغن"),
    (r"زعفران|دارچین|زردچوبه|فلفل|نمک|ادویه", "ادویه"),
    (r"گوجه|پیاز|سیر|سیب.?زمینی|هویج|خیار|بادمجان|کدو|قارچ|سبزی|جعفری|شوید", "سبزیجات"),
    (r"عدس|لوبیا|نخود|لپه", "حبوبات"),
    (r"رب|کنسرو", "کنسرو"),
    (r"لیمو|آبلیمو|سرکه", "چاشنی"),
    (r"شکر|عسل", "شیرینی"),
    (r"گردو|پسته|بادام", "خشکبار"),
]

# Longer phrases first so «سینه مرغ» is مرغ, not a separate noisy key.
INGREDIENT_PATTERNS: list[tuple[str, str]] = [
    (r"شنسل|شنیسل", "شنسل مرغ"),
    (r"سینه.?مرغ|فیله.?مرغ", "سینه مرغ"),
    (r"گوشت.?چرخ", "گوشت چرخ"),
    (r"رب.?گوجه", "رب گوجه"),
    (r"روغن.?زیتون", "روغن زیتون"),
    (r"فلفل.?سیاه", "فلفل"),
    (r"فلفل.?دلمه", "فلفل دلمه"),
    (r"سیب.?زمینی.?(خلال|سرخ|منجمد)", "سیب زمینی سرخ"),
    (r"سیب.?زمینی", "سیب زمینی"),
    (r"تخم.?مرغ", "تخم مرغ"),
    (r"ران.?مرغ", "ران مرغ"),
    (r"آبلیمو", "آبلیمو"),
    (r"^آرد.?نخود", "آرد نخودچی"),
    (r"^آرد.?سوخاری", "آرد سوخاری"),
    (r"^آرد.?برنج", "آرد برنج"),
    (r"^آرد.?ذرت|^آرد.?نشاسته|^نشاسته", "آرد ذرت"),
    (r"^آرد", "آرد گندم"),
    (r"ماکارون|پاستا|اسپاگتی", "ماکارونی"),
    (r"مرغ", "مرغ"),
    (r"گوشت", "گوشت"),
    (r"ماهی", "ماهی"),
    (r"میگو", "میگو"),
    (r"برنج", "برنج"),
    (r"نان.?تست|نان.?توست", "نان تست"),
    (r"نان", "نان"),
    (r"روغن", "روغن"),
    (r"کره", "کره"),
    (r"خامه", "خامه"),
    (r"شیر.?کاکائو", "شیر کاکائو"),
    (r"شیر", "شیر"),
    (r"ماست", "ماست"),
    (r"پارمزان|پارمسان|parmesan", "پنیر پارمزان"),
    (r"فتا", "پنیر فتا"),
    (r"موزارلا", "پنیر موزارلا"),
    (r"پنیر", "پنیر"),
    (r"گوجه", "گوجه"),
    (r"پیاز.?سرخ", "پیاز سرخ"),
    (r"پیاز", "پیاز"),
    (r"سیر.?سرخ", "سیر سرخ"),
    (r"سیر", "سیر"),
    (r"هویج", "هویج"),
    (r"بادمجان", "بادمجان"),
    (r"کدو", "کدو"),
    (r"خیار", "خیار"),
    (r"قارچ", "قارچ"),
    (r"جعفری", "جعفری"),
    (r"شوید", "شوید"),
    (r"لیمو", "لیمو"),
    (r"سرکه", "سرکه"),
    (r"عدس", "عدس"),
    (r"لوبیا.?سبز", "لوبیا سبز"),
    (r"لوبیا.?قرمز", "لوبیا قرمز"),
    (r"لوبیا.?چیتی", "لوبیا چیتی"),
    (r"لوبیا", "لوبیا"),
    (r"نخود", "نخود"),
    (r"لپه", "لپه"),
    (r"شکر.?قهوه", "شکر قهوه ای"),
    (r"شکر", "شکر"),
    (r"نمک(?!ی)", "نمک"),
    (r"فلفل", "فلفل"),
    (r"زعفران", "زعفران"),
    (r"دارچین", "دارچین"),
    (r"زردچوبه", "زردچوبه"),
    (r"عسل", "عسل"),
    (r"گردو", "گردو"),
    (r"پسته", "پسته"),
    (r"سبزی", "سبزی"),
]

ALIASES = {
    "نمک خوراکی": "نمک",
    "نمک یددار": "نمک",
    "شکر سفید": "شکر",
    "آرد": "آرد گندم",
    "آرد سفید": "آرد گندم",
    "آرد گندم": "آرد گندم",
    "روغن مایع": "روغن",
    "فلفل سیاه": "فلفل",
    "پارمزان": "پنیر پارمزان",
    "پنیر پارمزان": "پنیر پارمزان",
}


def norm_text(value: str) -> str:
    value = (value or "").translate(ARABIC_YE)
    value = re.sub(r"\s+", " ", value).strip()
    return value


def parse_unit(title: str) -> tuple[float | None, str | None, float | None, float | None]:
    m = UNIT_RE.search(title or "")
    if not m:
        return None, None, None, None
    raw = m.group("n").replace("/", ".")
    try:
        n = float(raw)
    except ValueError:
        return None, None, None, None
    unit = m.group("u").replace("گرمی", "گرم").replace("کیلوگرم", "کیلو")
    grams = None
    milliliters = None
    if "کیلو" in unit:
        grams = n * 1000
    elif unit.startswith("گرم"):
        grams = n
    elif "میلی" in unit:
        milliliters = n
    elif unit.startswith("لیتر"):
        milliliters = n * 1000
    return n, unit, grams, milliliters


def guess_brand(title: str) -> str:
    for brand in BRANDS:
        if brand in title:
            return brand
    return ""


def is_grocery(title: str, slug: str = "") -> bool:
    if NON_GROCERY_RE.search(title or ""):
        return False
    slug_l = (slug or "").lower()
    if any(k in slug_l for k in ("shampoo", "hygiene", "personal", "detergent", "cosmetic")):
        return False
    return True


def canonical_ingredient(text: str) -> str:
    title = norm_text(text)
    if title in ALIASES:
        return ALIASES[title]
    for pattern, key in INGREDIENT_PATTERNS:
        if re.search(pattern, title):
            return key
    return title.split(" ")[0] if title else ""


def guess_ingredient(title: str) -> str:
    if not is_grocery(title):
        return ""
    return canonical_ingredient(title)


def guess_category(title: str, slug: str) -> str:
    if not is_grocery(title, slug):
        return "غیرخوراکی"
    slug_l = (slug or "").lower()
    for key, label in SLUG_CATEGORY.items():
        if key in slug_l:
            return label
    for pattern, label in KEYWORD_CATEGORY:
        if re.search(pattern, title):
            return label
    return "سایر"


def tokens(title: str) -> list[str]:
    parts = re.split(r"[^\w\u0600-\u06FF]+", title)
    return [p for p in parts if len(p) >= 2]


def requested_to_base(amount: float, unit: str) -> tuple[float | None, str]:
    """Map a recipe quantity to grams, milliliters, or pieces."""
    unit_n = norm_text(unit or "گرم")
    if unit_n in ("کیلو", "کیلوگرم"):
        return amount * 1000, "g"
    if unit_n in ("گرم", "گرمی"):
        return amount, "g"
    if unit_n in ("لیتر",):
        return amount * 1000, "ml"
    if unit_n in ("میلی لیتر", "میلی‌لیتر", "سی سی"):
        return amount, "ml"
    if unit_n in ("عدد", "دانه", "بسته"):
        return amount, "piece"
    return amount, "g"


def preprocess_item(row: dict[str, Any]) -> dict[str, Any]:
    item = row.get("item") or {}
    title = norm_text(str(item.get("title") or ""))
    slug = str(item.get("subcategory_slug") or "")
    price = float(item.get("price") or 0)
    discount = float(item.get("discount") or 0)
    if discount < 0 or discount > price:
        discount = 0
    images = item.get("images") or []
    image = ""
    if images:
        image = images[0].get("main") or images[0].get("thumb") or ""
    amount, unit, grams, milliliters = parse_unit(title)
    final = price - discount
    per_100g = round(final * 100 / grams, 1) if grams and grams > 0 else None
    per_100ml = round(final * 100 / milliliters, 1) if milliliters and milliliters > 0 else None
    per_piece = None
    if unit in ("عدد", "بسته") and amount and amount > 0:
        per_piece = round(final / amount, 1)
    ratio = item.get("discountRatio")
    if ratio is None and price:
        ratio = round(100 * discount / price, 2)
    grocery = is_grocery(title, slug)
    entity = norm_text(str(item.get("product_entity") or ""))
    ingredient = ""
    if grocery:
        ingredient = entity or guess_ingredient(title)
    category_title = norm_text(str(item.get("category_title") or ""))
    subcategory_title = norm_text(str(item.get("subcategory_title") or ""))
    return {
        "snapp_id": str(row.get("snapp_id") or item.get("id") or ""),
        "document_id": row.get("document_id") or item.get("document_id"),
        "title": title,
        "title_norm": title.lower(),
        "price": int(price),
        "discount": int(discount + 0.5),
        "discount_ratio": float(ratio or 0),
        "price_final": int(final + 0.5),
        "image_url": image,
        "subcategory_slug": slug,
        "category": category_title or guess_category(title, slug),
        "snapp_category_id": str(item.get("category_id") or ""),
        "snapp_category_title": category_title,
        "snapp_category_slug": str(item.get("category_slug") or ""),
        "snapp_subcategory_id": str(item.get("subcategory_id") or ""),
        "snapp_subcategory_title": subcategory_title,
        "snapp_subcategory": subcategory_title,
        "brand": guess_brand(title),
        "amount_value": amount,
        "amount_unit": unit,
        "grams": grams,
        "milliliters": milliliters,
        "price_per_100g": per_100g,
        "price_per_100ml": per_100ml,
        "price_per_piece": per_piece,
        "is_grocery": 1 if grocery else 0,
        "ingredient_key": ingredient,
        "query": row.get("query") or "",
        "tokens": " ".join(tokens(title)),
    }
