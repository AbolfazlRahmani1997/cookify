# Cookify Snapp analytics

سرویس پایتون برای **جمع‌آوری** داده از اسنپ‌مارکت، **دسته‌بندی** (خوراکی / ماده / دسته)، **نرمال‌سازی وزن و حجم** و **تخمین قیمت**. جستجوی زندهٔ اپ در API گول است؛ این سرویس دیتاست چندبسته‌ای می‌سازد تا تخمین روی قیمت واحد باشد نه قیمت یک شامپو یا یک کیسهٔ ۷۰۰ گرمی.

تخمین درست به دو لایه نیاز دارد:

1. دسته‌بندی: غیرخوراکی جدا شود و هر محصول به یک مادهٔ استاندارد برسد (`ingredient_key` مثل نمک، مرغ).
2. مقدار و قیمت واحد: بسته‌های ۵۰۰ گرم، ۷۰۰ گرم، ۱ کیلو جدا ذخیره می‌شوند و `price_per_100g` / `price_per_100ml` محاسبه می‌شود. تخمین «۱۰ گرم نمک» از میانهٔ قیمت واحد است، نه قیمت کل بسته.

## اجرا

```bash
cd analytics
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

جمع‌آوری نمونه (۲ کوئری، ۲ صفحه):

```bash
python -m snapp_analytics ingest --pages 2 --query مرغ --query برنج
```

جمع‌آوری کامل‌تر از `queries.json` (مواد رایج آشپزی):

```bash
python -m snapp_analytics ingest --pages 5
python -m snapp_analytics preprocess
python -m snapp_analytics classify --limit 40
python -m snapp_analytics stats
python -m snapp_analytics estimate نمک --amount 10 --unit گرم
python -m snapp_analytics export
```

API تحلیل:

```bash
python -m snapp_analytics serve
```

- `POST /ingest` `{ "queries": ["مرغ"], "max_pages": 5 }`
- `POST /preprocess`
- `GET /stats`
- `GET /products?category=پروتئین&q=سینه&ingredient=مرغ&grocery_only=true`
- `POST /match` `{ "name": "سینه مرغ" }`
- `POST /estimate` `{ "name": "نمک", "amount": 10, "unit": "گرم" }`
- `POST /classify` `{ "limit": 40 }`
- `POST /export`

دسته‌بندی از دسته و زیردستهٔ خود اسنپ‌مارکت می‌آید (`category_title` و `subcategory_title`) و در دیتابیس محصولات ذخیره می‌شود. مدل زبانی در این مسیر صدا زده نمی‌شود. قانون‌ها فقط وتو می‌مانند: شامپو خوراکی نمی‌شود و شنسل به‌جای سینه مرغ ثبت نمی‌شود.

سرویس پایتون یک صف دائمی است. بک‌اند گول بعد از هر جستجوی تازهٔ اسنپ، محصول‌ها را به `POST /queue` می‌فرستد و جواب کاربر را معطل دسته‌بندی نمی‌کند. کارگر داخل سرویس پایتون همان صف را برمی‌دارد و دستهٔ اسنپ را روی محصول می‌نویسد.

```bash
python -m snapp_analytics serve
```

- `POST /queue` `{ "items": [{ "snapp_id", "title", "price", "subcategory_slug", "query" }] }`
- `GET /queue` تعداد `pending` / `processing` / `done` / `error`

دادهٔ کاتالوگ در Postgres است، دیتابیس `cookify` و اسکیمای `catalog`، همان `DATABASE_URL` بک‌اند (`postgres://cookify:cookify@localhost:5432/cookify`). اسکیمای قدیمی `snapp` در اولین اتصال به `catalog` منتقل می‌شود. اگر `analytics/data/snapp.sqlite` هنوز وجود داشته باشد و جدول خالی باشد، همان اتصال آن را هم کپی می‌کند. JSON خام هر صفحه و در صورت export فایل parquet همچنان در `analytics/data/` می‌مانند.

بین درخواست‌ها وقفه است تا به اسنپ فشار نیاید. موقعیت پیش‌فرض تهران است (`SNAPP_LAT` / `SNAPP_LONG`).

در نوت‌بوک:

```python
from snapp_analytics.store import to_dataframe
from snapp_analytics.analyze import stats, match_name

df = to_dataframe()
stats()
```
