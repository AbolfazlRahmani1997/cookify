from __future__ import annotations

import json
import os
import re
from typing import Any

import httpx

from snapp_analytics.preprocess import (
    INGREDIENT_PATTERNS,
    canonical_ingredient,
    is_grocery,
    norm_text,
)
from snapp_analytics.prompts import (
    CATEGORIES,
    CATEGORY_FA,
    MAX_TOKENS,
    PROMPT_ID,
    SYSTEM,
    TEMPERATURE,
    user_prompt,
)

def _lms_base() -> str:
    raw = os.getenv("COOKIFY_LMS_URL", "http://localhost:1234/v1").rstrip("/")
    if not raw.endswith("/v1"):
        raw = f"{raw}/v1"
    return raw


LMS_URL = _lms_base()
LMS_MODEL = os.getenv("COOKIFY_LMS_MODEL", "")

ALLOWED_INGREDIENTS = list(dict.fromkeys(key for _, key in INGREDIENT_PATTERNS))
ALLOWED_FORMS = ("raw", "processed", "non_grocery")

_PROCESSED_RE = re.compile(
    r"شنسل|شنیسل|ناگت|سوخاری|کنسرو|ساندویچ|کوکتل|سوسیس|ژامبون|الویه"
)

# Culinary class for titles the rules already recognize. The local model
# sometimes mistranslates these (خامه → bread), so the known class wins.
KNOWN_CATEGORY = {
    "شنسل مرغ": "processed_food",
    "سینه مرغ": "poultry",
    "مرغ": "poultry",
    "گوشت": "meat",
    "ماهی": "seafood",
    "میگو": "seafood",
    "تخم مرغ": "egg",
    "رب گوجه": "sauce",
    "روغن زیتون": "oil",
    "روغن": "oil",
    "ماکارونی": "grain",
    "برنج": "grain",
    "آرد": "grain",
    "نان": "grain",
    "کره": "dairy",
    "خامه": "dairy",
    "شیر": "dairy",
    "ماست": "dairy",
    "پنیر پارمزان": "dairy",
    "پنیر فتا": "dairy",
    "پنیر موزارلا": "dairy",
    "پنیر": "dairy",
    "فلفل دلمه": "vegetable",
    "سیب زمینی": "vegetable",
    "گوجه": "vegetable",
    "پیاز": "vegetable",
    "سیر": "vegetable",
    "هویج": "vegetable",
    "بادمجان": "vegetable",
    "کدو": "vegetable",
    "خیار": "vegetable",
    "قارچ": "mushroom",
    "جعفری": "herb",
    "شوید": "herb",
    "سبزی": "herb",
    "فلفل": "spice",
    "نمک": "spice",
    "زعفران": "spice",
    "دارچین": "spice",
    "زردچوبه": "spice",
    "آبلیمو": "sauce",
    "سرکه": "sauce",
    "لیمو": "fruit",
    "عدس": "legume",
    "لوبیا": "legume",
    "نخود": "legume",
    "لپه": "legume",
    "شکر": "sweetener",
    "عسل": "sweetener",
    "گردو": "nut",
    "پسته": "nut",
}

_EN_TO_KEY = {
    "salt": "نمک",
    "pepper": "فلفل",
    "sugar": "شکر",
    "flour": "آرد",
    "rice": "برنج",
    "pasta": "ماکارونی",
    "bread": "نان",
    "oil": "روغن",
    "olive oil": "روغن زیتون",
    "butter": "کره",
    "cream": "خامه",
    "milk": "شیر",
    "yogurt": "ماست",
    "parmesan": "پنیر پارمزان",
    "parmesan cheese": "پنیر پارمزان",
    "feta": "پنیر فتا",
    "mozzarella": "پنیر موزارلا",
    "cheese": "پنیر",
    "chicken breast": "سینه مرغ",
    "chicken schnitzel": "شنسل مرغ",
    "schnitzel": "شنسل مرغ",
    "chicken": "مرغ",
    "meat": "گوشت",
    "fish": "ماهی",
    "shrimp": "میگو",
    "egg": "تخم مرغ",
    "tomato paste": "رب گوجه",
    "tomato": "گوجه",
    "onion": "پیاز",
    "garlic": "سیر",
    "turkey breast": "بوقلمون",
    "turkey": "بوقلمون",
}


def allowed_ingredients() -> list[str]:
    return ALLOWED_INGREDIENTS


def rule_veto(title: str, slug: str = "") -> dict[str, Any] | None:
    title_n = norm_text(title)
    if not is_grocery(title_n, slug):
        return {
            "is_grocery": False,
            "ingredient_key": "",
            "form": "non_grocery",
            "source": "rule",
        }
    if _PROCESSED_RE.search(title_n):
        key = canonical_ingredient(title_n)
        if key in ("سینه مرغ", "مرغ") and re.search(r"شنسل|شنیسل", title_n):
            key = "شنسل مرغ"
        return {
            "is_grocery": True,
            "ingredient_key": key,
            "form": "processed",
            "source": "rule",
        }
    return None


def merge_classification(title: str, slug: str, llm: dict[str, Any] | None) -> dict[str, Any]:
    veto = rule_veto(title, slug)
    if veto:
        out = dict(veto)
        out["llm"] = llm or {}
        return out
    key = ""
    form = "raw"
    grocery = True
    source = "rule"
    food = normalize_food_classification(llm, title)
    if food:
        key = food["name_fa"]
        source = "llm"
        if food["category_en"] == "other":
            grocery = False
            form = "non_grocery"
            key = ""
        elif food["category_en"] == "processed_food":
            form = "processed"
        llm = food
    elif llm:
        raw_key = norm_text(str(llm.get("ingredient_key") or ""))
        mapped = _EN_TO_KEY.get(raw_key.lower(), "")
        if raw_key in ALLOWED_INGREDIENTS:
            key = raw_key
            source = "llm"
        elif mapped in ALLOWED_INGREDIENTS:
            key = mapped
            source = "llm"
        llm_form = str(llm.get("form") or "")
        if llm_form in ALLOWED_FORMS:
            form = llm_form
        if llm.get("is_grocery") is False:
            grocery = False
            form = "non_grocery"
            key = ""
            source = "llm"
    if not key:
        key = canonical_ingredient(title)
        if source != "llm":
            source = "rule"
    if form == "non_grocery":
        grocery = False
        key = ""
    out = {
        "is_grocery": grocery,
        "ingredient_key": key if grocery else "",
        "form": form if grocery else "non_grocery",
        "source": source,
        "category_fa": (llm or {}).get("category_fa", ""),
        "category_en": (llm or {}).get("category_en", ""),
        "name_en": (llm or {}).get("name_en", ""),
        "confidence": (llm or {}).get("confidence"),
        "needs_review": bool((llm or {}).get("needs_review")),
        "llm": llm or {},
    }
    if grocery:
        _apply_known_ingredient(out, title)
    return out


def _apply_known_ingredient(out: dict[str, Any], title: str) -> None:
    canon = canonical_ingredient(title)
    if canon not in ALLOWED_INGREDIENTS:
        category_en = str(out.get("category_en") or "")
        if category_en in CATEGORY_FA:
            out["category_fa"] = CATEGORY_FA[category_en]
        return
    expected = KNOWN_CATEGORY.get(canon, "")
    model_category = str(out.get("category_en") or "")
    out["ingredient_key"] = canon
    if expected and model_category != expected:
        if model_category:
            out["needs_review"] = True
        out["category_en"] = expected
        out["category_fa"] = CATEGORY_FA[expected]
    elif model_category in CATEGORY_FA:
        out["category_fa"] = CATEGORY_FA[model_category]


def _text(value: Any) -> str:
    if isinstance(value, str):
        return value.strip()
    return ""


def normalize_food_classification(raw: dict[str, Any] | None, ingredient: str) -> dict[str, Any] | None:
    """Keep only the food_ingredient_classification/local/v1 object."""
    if not isinstance(raw, dict):
        return None
    name_fa = norm_text(_text(raw.get("name_fa")))
    name_en = _text(raw.get("name_en"))
    category_en = _text(raw.get("category_en")).lower().replace(" ", "_")
    if category_en not in CATEGORIES or not name_fa or not name_en:
        return None
    try:
        confidence = float(raw.get("confidence"))
    except (TypeError, ValueError):
        return None
    confidence = max(0.0, min(1.0, confidence))
    category_fa = CATEGORY_FA[category_en]
    needs_review = bool(raw.get("needs_review")) or confidence < 0.8
    return {
        "name_fa": name_fa,
        "name_en": name_en,
        "category_fa": category_fa,
        "category_en": category_en,
        "confidence": confidence,
        "needs_review": needs_review,
        "prompt_id": PROMPT_ID,
    }


def parse_llm_json(text: str) -> dict[str, Any]:
    text = (text or "").strip()
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.S)
    if fenced:
        text = fenced.group(1)
    else:
        start, end = text.find("{"), text.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise ValueError("no json object in model output")
        text = text[start : end + 1]
    parsed = json.loads(text)
    if not isinstance(parsed, dict):
        raise ValueError("llm json is not an object")
    return parsed


_PREFERRED = (
    "lfm2.5-1.2b-instruct-mlx",
    "gemma-3n-e4b-it-mlx",
    "qwen3-8b-mlx",
)


def _catalog() -> list[dict[str, Any]]:
    root = LMS_URL.removesuffix("/v1")
    with httpx.Client(timeout=3.0) as client:
        res = client.get(f"{root}/api/v0/models")
        res.raise_for_status()
        data = res.json().get("data") or []
    return [item for item in data if isinstance(item, dict)]


def _chat_ids(items: list[dict[str, Any]]) -> list[str]:
    names = []
    for item in items:
        mid = str(item.get("id") or "")
        if not mid or "embed" in mid.lower():
            continue
        names.append(mid)
    return names


def loaded_models() -> list[str]:
    loaded = []
    for item in _catalog():
        mid = str(item.get("id") or "")
        if not mid or "embed" in mid.lower():
            continue
        if item.get("state") == "loaded":
            loaded.append(mid)
    return loaded


def active_model() -> str:
    if LMS_MODEL:
        return LMS_MODEL
    loaded = loaded_models()
    if loaded:
        return loaded[0]
    available = _chat_ids(_catalog())
    for preferred in _PREFERRED:
        if preferred in available:
            return preferred
    if not available:
        raise RuntimeError("در LM Studio مدل چت پیدا نشد")
    return available[0]


def model_input(title: str) -> str:
    """Send an ingredient, not the pack size, to the classifier prompt."""
    text = norm_text(title)
    key = canonical_ingredient(text)
    if key in ALLOWED_INGREDIENTS:
        return key
    cleaned = re.sub(
        r"\d+(?:[./]\d+)?\s*(?:کیلو(?:گرم)?|گرمی|گرم|میلی[\u200c\s]?لیتر|لیتر|عدد)",
        " ",
        text,
    )
    cleaned = re.sub(r"\s+", " ", cleaned).strip(" -")
    return cleaned or text


def classify_with_lmstudio(title: str, timeout: float = 120.0) -> dict[str, Any]:
    payload = {
        "model": active_model(),
        "temperature": TEMPERATURE,
        "max_tokens": MAX_TOKENS,
        # Qwen3 spends the whole token budget on reasoning and returns empty JSON.
        "chat_template_kwargs": {"enable_thinking": False},
        "messages": [
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": user_prompt(model_input(title)) + "\n/no_think"},
        ],
    }
    with httpx.Client(timeout=timeout) as client:
        res = client.post(f"{LMS_URL}/chat/completions", json=payload)
        res.raise_for_status()
        body = res.json()
    choices = body.get("choices") or []
    if not choices:
        raise ValueError("LM Studio پاسخی نداد")
    content = ((choices[0].get("message") or {}).get("content") or "").strip()
    return parse_llm_json(content)


def lms_available() -> tuple[bool, str]:
    try:
        chosen = active_model()
    except Exception as exc:  # noqa: BLE001
        return False, f"LM Studio در دسترس نیست ({LMS_URL}): {exc}"
    return True, chosen


def classify_title(title: str, slug: str = "", use_llm: bool = False) -> dict[str, Any]:
    llm = None
    if use_llm:
        try:
            llm = classify_with_lmstudio(title)
        except Exception:
            llm = None
    return merge_classification(title, slug, llm)
