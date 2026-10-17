# Graph Report - cookify_frontend_ui  (2026-09-16)

## Corpus Check
- 114 files · ~2,091,037 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 587 nodes · 703 edges · 109 communities (77 shown, 32 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- compilerOptions
- package.json
- Cookify — Frontend Only / OpenCode
- compilerOptions
- Store
- reference_images
- types.ts
- format.ts
- placeholder.ts
- Button.tsx
- ToastContext.tsx
- CommunityContext.tsx
- api.ts
- AssistantForm.tsx
- SavedContext.tsx
- ShoppingListContext.tsx
- users.ts
- LandingPage.tsx
- Badge.tsx
- recipes.ts
- Chip.tsx
- IconButton.tsx
- SelectField.tsx
- Tabs.tsx
- TextField.tsx
- ToastViewport.tsx
- AppLayout.tsx
- Footer.tsx
- Header.tsx
- MobileNav.tsx
- products.ts
- useAsync.ts
- cn.ts
- RecipePage.tsx
- tsconfig.json
- community.ts
- AssistantPage.tsx
- CommunityPage.tsx
- foodIcons.ts
- PhoneMockup.tsx
- MarketingHeader.tsx
- SidebarNav.tsx
- banners.ts
- TopBar.tsx
- images.ts
- AuthContext.tsx
- FollowContext.tsx
- messages.ts
- CategoriesPage.tsx
- notifications.ts
- AboutPage.tsx
- API
- models.go
- SeedIfEmpty
- Cookify API — Gin + GORM + PostgreSQL
- Recommend
- cookify/backend
- devDependencies

## God Nodes (most connected - your core abstractions)
1. `Store` - 53 edges
2. `API` - 41 edges
3. `writeJSON()` - 39 edges
4. `writeError()` - 25 edges
5. `currentUser()` - 19 edges
6. `compilerOptions` - 18 edges
7. `compilerOptions` - 15 edges
8. `Cookify — Frontend Only / OpenCode` - 14 edges
9. `newID()` - 10 edges
10. `Pages` - 8 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `OpenDB()`  [INFERRED]
  backend/main.go → backend/store.go
- `SeedIfEmpty()` --calls--> `defaultShoppingList()`  [INFERRED]
  backend/seed.go → backend/store.go
- `SeedIfEmpty()` --calls--> `hashPassword()`  [INFERRED]
  backend/seed.go → backend/store.go
- `API` --references--> `Store`  [EXTRACTED]
  backend/http.go → backend/store.go
- `NewRouter()` --references--> `Store`  [EXTRACTED]
  backend/http.go → backend/store.go

## Import Cycles
- None detected.

## Communities (109 total, 32 thin omitted)

### Community 0 - "compilerOptions"
Cohesion: 0.08
Nodes (23): DOM, DOM.Iterable, ES2020, src, compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules (+15 more)

### Community 1 - "package.json"
Cohesion: 0.09
Nodes (21): @fontsource/vazirmatn, lucide-react, dependencies, @fontsource/vazirmatn, lucide-react, react, react-dom, react-router-dom (+13 more)

### Community 2 - "Cookify — Frontend Only / OpenCode"
Cohesion: 0.09
Nodes (21): Accessibility, Assistant `/assistant`, Community `/community`, Component Architecture, Cookify — Frontend Only / OpenCode, Create Result `/community/create`, Design, Implementation Order (+13 more)

### Community 3 - "compilerOptions"
Cohesion: 0.10
Nodes (19): ES2023, node, vite.config.ts, compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module (+11 more)

### Community 4 - "Store"
Cohesion: 0.07
Nodes (18): AppNotification, Store, checkPassword(), defaultShoppingList(), Recipe, User, hashPassword(), newID() (+10 more)

### Community 5 - "reference_images"
Cohesion: 0.12
Nodes (16): import, name, note, reference_images, screens, assets-board.png, assistant-home.png, assistant-home.svg (+8 more)

### Community 6 - "types.ts"
Cohesion: 0.13
Nodes (15): AssistantRequest, Comment, CommunityPost, CommunityPostView, Difficulty, Ingredient, Product, ProductAvailability (+7 more)

### Community 7 - "format.ts"
Cohesion: 0.33
Nodes (8): formatDate(), formatMinutes(), formatNumber(), formatRating(), formatToman(), PERSIAN_DIGITS, relativeTime(), toPersianDigits()

### Community 8 - "placeholder.ts"
Cohesion: 0.36
Nodes (9): AVATAR_COLORS, avatarImage(), foodImage(), hashString(), mulberry32(), Palette, PALETTES, productImage() (+1 more)

### Community 9 - "Button.tsx"
Cohesion: 0.29
Nodes (6): Button, ButtonProps, Size, sizes, Variant, variants

### Community 10 - "ToastContext.tsx"
Cohesion: 0.29
Nodes (4): Toast, ToastContext, ToastContextValue, ToastVariant

### Community 12 - "CommunityContext.tsx"
Cohesion: 0.33
Nodes (3): CommunityContext, CommunityContextValue, PublishInput

### Community 13 - "api.ts"
Cohesion: 0.40
Nodes (3): api, delay(), isFailureForced()

### Community 14 - "AssistantForm.tsx"
Cohesion: 0.40
Nodes (3): MEAL_TYPES, QUICK_INGREDIENTS, TIME_OPTIONS

### Community 16 - "ShoppingListContext.tsx"
Cohesion: 0.33
Nodes (3): DEFAULT_ITEMS, ShoppingListContext, ShoppingListContextValue

### Community 18 - "LandingPage.tsx"
Cohesion: 0.40
Nodes (3): FEATURES, STATS, STORES

### Community 81 - "foodIcons.ts"
Cohesion: 0.33
Nodes (3): Rule, RULES, TONES

### Community 85 - "banners.ts"
Cohesion: 0.40
Nodes (3): BANNERS, CategoryBanner, LOGO

### Community 91 - "images.ts"
Cohesion: 0.40
Nodes (3): RECIPE_IDS, recipeIdFromSeed(), recipePhoto()

### Community 94 - "messages.ts"
Cohesion: 0.50
Nodes (3): ChatMessage, Conversation, conversations

### Community 102 - "API"
Cohesion: 0.15
Nodes (7): API, currentUser(), User, writeError(), writeJSON(), github.com/gin-gonic/gin.Context, github.com/gin-gonic/gin.HandlerFunc

### Community 103 - "models.go"
Cohesion: 0.13
Nodes (21): AppNotification, AssistantRequest, AuthResponse, ChatMessage, Comment, CommunityPost, CommunityPostView, ContactMessage (+13 more)

### Community 104 - "SeedIfEmpty"
Cohesion: 0.31
Nodes (7): NewRouter(), loadDotEnv(), main(), readSeed(), SeedIfEmpty(), github.com/gin-gonic/gin.Engine, io/fs.FS

### Community 105 - "Cookify API — Gin + GORM + PostgreSQL"
Cohesion: 0.25
Nodes (7): Auth, Community / Users, Cookify API — Gin + GORM + PostgreSQL, Messages / Notifications / Contact, Products / Shopping, Recipes / Assistant, اجرا

### Community 106 - "Recommend"
Cohesion: 0.40
Nodes (4): AssistantRequest, Recipe, Recommend(), Recommendation

### Community 108 - "devDependencies"
Cohesion: 0.11
Nodes (19): autoprefixer, devDependencies, autoprefixer, postcss, tailwindcss, @types/node, @types/react, @types/react-dom (+11 more)

## Knowledge Gaps
- **196 isolated node(s):** `cookify/backend`, `Product`, `ShoppingListItem`, `AssistantRequest`, `AppNotification` (+191 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **32 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `SeedIfEmpty`, `API`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `API` connect `API` to `Store`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `AuthResponse` connect `models.go` to `Store`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **What connects `cookify/backend`, `Product`, `ShoppingListItem` to the rest of the system?**
  _196 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `Cookify — Frontend Only / OpenCode` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._