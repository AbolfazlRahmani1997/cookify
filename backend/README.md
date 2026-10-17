# Cookify API — Gin + GORM + PostgreSQL

قرارداد REST همان فرانت است. داده در Postgres ذخیره می‌شود و بار اول از `seed/*.json` سید می‌شود.

## اجرا

```bash
cd backend
docker compose up -d
cp .env.example .env   # در صورت نیاز
go run .
```

پایه: `http://localhost:8080`  
تصاویر دستور پخت: `http://localhost:8080/static/food/r1.jpg` … `r16.jpg`  
ورود: `sara@cookify.ir` / `cookify123`

`DATABASE_URL` پیش‌فرض: `postgres://cookify:cookify@localhost:5432/cookify?sslmode=disable`

پاسخ‌ها: `{ "data": ... }` یا `{ "error": "..." }`

## Auth
| Method | Path | Auth |
|---|---|---|
| POST | `/api/auth/register` | `{name,email,password}` |
| POST | `/api/auth/login` | `{email,password}` |
| POST | `/api/auth/logout` | Bearer |
| GET | `/api/auth/me` | Bearer |

## Recipes / Assistant
| Method | Path |
|---|---|
| GET | `/api/recipes?q=&category=&tag=&cuisine=&limit=` |
| GET | `/api/recipes/popular?limit=` |
| POST | `/api/recipes` Bearer (فقط `chef`/`staff`) |
| POST | `/api/recipes/:id/image` Bearer |
| POST | `/api/recipes/:id/reviews` Bearer `{rating,comment}` |
| POST | `/api/recipes/:id/save` Bearer |
| POST | `/api/assistant/recommend` `{ingredients,timeMinutes,mealType,servings}` |

## Products / Shopping
| Method | Path |
|---|---|
| GET | `/api/products?q=&page=&size=&lat=&long=` | بدون `q` کاتالوگ داخلی؛ با `q` جستجوی زنده اسنپ‌مارکت |
| POST | `/api/products/match` `{names:[]}` | بهترین محصول خوراکی اسنپ برای هر ماده |
| GET | `/api/products/:id` |
| GET/PUT/DELETE | `/api/shopping-list` Bearer |
| POST | `/api/shopping-list/items` Bearer |
| PATCH/DELETE | `/api/shopping-list/items/:id` Bearer |
| POST | `/api/shopping-list/from-recipe` Bearer `{recipeId,servings}` |

## Community / Users
| Method | Path |
|---|---|
| GET | `/api/community/posts?tab=` |
| GET | `/api/community/posts/:id` |
| POST | `/api/community/posts` Bearer |
| POST | `/api/community/posts/:id/like` Bearer |
| POST | `/api/community/posts/:id/comments` Bearer `{text}` |
| GET | `/api/users` `/api/users/:username` |
| POST | `/api/users/:username/follow` Bearer |
| GET | `/api/me/saved-recipes` `/api/me/following` Bearer |

## Messages / Notifications / Contact
| Method | Path |
|---|---|
| GET/POST | `/api/messages` `/api/messages/:id` Bearer |
| GET | `/api/notifications` Bearer |
| POST | `/api/notifications/:id/read` `/api/notifications/read-all` Bearer |
| POST | `/api/contact` |
| GET | `/api/health` |
