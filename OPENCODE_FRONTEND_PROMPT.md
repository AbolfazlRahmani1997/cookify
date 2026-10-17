# Cookify — Frontend Only / OpenCode

تو یک Senior Frontend Engineer متخصص React + TypeScript هستی.
فعلاً فقط FRONTEND پروژه Cookify را پیاده‌سازی کن. Backend، Laravel، Database و Crawler را فعلاً دست نزن.

## Reference
پوشه `ui/` شامل SVGهای Figma-ready و `reference/` شامل تصاویر مرجع UI است. قبل از پیاده‌سازی همه را بررسی کن.

## Stack
- React + TypeScript
- Vite
- Tailwind CSS
- React Router
- Lucide React
- Vazirmatn
- RTL
- در صورت نیاز TanStack Query، ولی فعلاً API واقعی نداریم.

## Design
Primary #10B981
Primary Dark #059669
Primary Light #ECFDF5
Text #1F2937
Muted #6B7280
Border #E5E7EB
Background #F8FAFC
Accent #F59E0B

- کاملاً RTL
- Header و Navigation اصلی سمت راست
- Shopping List سمت چپ در دسکتاپ
- Avatar کاربر سمت راست کارت Community
- تصویر غذا سمت راست کارت افقی
- Mobile تک‌ستونه و بدون horizontal overflow
- فونت Vazirmatn
- کارت سفید، radius نرم، shadow ظریف
- از emoji به جای icon اصلی استفاده نکن؛ Lucide React استفاده کن.

## Routes
/
 /assistant
 /recipes/:id
 /shopping-list
 /community
 /community/create
 /profile/:username

## Pages

### Landing `/`
Header، Hero، Search، CTA، Popular Recipes، Features، Community section، Stats، Footer.

Hero:
«امروز چه غذایی درست کنم؟»

CTA:
«پیشنهاد بده»

### Assistant `/assistant`
بخش «چه غذایی درست کنم؟» با:
- مواد موجود
- زمان
- نوع غذا
- تعداد نفرات
- پیشنهاد بده

فعلاً mock recommendation.

### Recipe `/recipes/:id`
- تصویر
- عنوان
- rating
- زمان
- servings
- difficulty
- ingredients
- steps
- tips
- reviews
- save/share

### Shopping `/shopping-list`
- مواد لازم
- matched products
- price
- discount
- availability
- total
- CTA «مشاهده همه در اسنپ‌مارکت»

فعلاً فقط mock data؛ integration واقعی نساز.

### Community `/community`
Feed دست‌پخت‌ها:
- avatar سمت راست
- username/date
- food image
- recipe
- rating
- caption
- «پیشنهاد من»
- like/comment/share
- مشاهده دستور پخت

### Create Result `/community/create`
- انتخاب Recipe
- image upload
- caption
- rating
- suggestion
- publish

### Profile `/profile/:username`
Avatar، نام، bio، followers/following، cooking results، saved recipes.

## Component Architecture

src/
  components/
    layout/
    recipe/
    product/
    shopping/
    community/
    assistant/
    common/

کامپوننت‌ها reusable باشند.

## Mock Data

src/mock/
- recipes.ts
- products.ts
- community.ts
- users.ts

Componentها مستقیم به mock data وابسته نباشند؛ یک data layer ساده ایجاد کن تا بعداً Laravel API جایگزین شود.

## State
Shopping List:
- add/remove
- quantity
- checked

Community:
- like toggle
- mock comments
- publish mock result

## UX States
برای صفحات مهم:
- Loading / Skeleton
- Empty
- Error + Retry
- Toast

## Responsive
<768 mobile
768–1199 tablet
>=1200 desktop

## Accessibility
Semantic HTML، alt، keyboard navigation، focus state، aria-label برای icon-only buttons.

## Implementation Order
1. Repository analysis
2. Existing frontend را حفظ/refactor کن
3. Tailwind/design tokens
4. RTL app shell
5. Landing
6. Assistant
7. Recipe
8. Shopping List
9. Community
10. Create Result
11. Profile
12. Responsive
13. UX states
14. Polish

## مهم
- Backend نساز.
- Crawler نساز.
- API واقعی Snapp Market نساز.
- Token/credential نساز.
- Authentication واقعی فعلاً نساز.
- UI را static mockup نساز؛ routing و interaction واقعی داشته باشد.
- معماری را طوری بساز که بعداً Laravel API بدون بازنویسی Componentها وصل شود.

در پایان:
- npm install
- npm run dev
باید بدون خطا اجرا شود.

همچنین در پایان لیست فایل‌های تغییرکرده و نحوه اجرای پروژه را گزارش کن.
