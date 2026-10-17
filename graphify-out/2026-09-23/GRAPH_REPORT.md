# Graph Report - cookify_frontend_ui  (2026-09-23)

## Corpus Check
- 143 files · ~2,192,895 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 828 nodes · 1295 edges · 120 communities (87 shown, 33 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- compilerOptions
- devDependencies
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
- CreateRecipePage.tsx
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
- client.ts
- Cookify API — Gin + GORM + PostgreSQL
- Recommend
- cookify/backend
- api.py
- Snapp
- classify.py
- Cookify Snapp analytics
- __init__.py

## God Nodes (most connected - your core abstractions)
1. `Store` - 63 edges
2. `API` - 49 edges
3. `writeJSON()` - 46 edges
4. `writeError()` - 34 edges
5. `currentUser()` - 24 edges
6. `Snapp` - 20 edges
7. `connect()` - 19 edges
8. `compilerOptions` - 18 edges
9. `preprocess_item()` - 16 edges
10. `compilerOptions` - 15 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `NewRouter()`  [INFERRED]
  backend/main.go → backend/http.go
- `mapSnappItem()` --calls--> `newID()`  [INFERRED]
  backend/snapp.go → backend/store.go
- `estimate_from_packs()` --calls--> `requested_to_base()`  [EXTRACTED]
  analytics/snapp_analytics/analyze.py → analytics/snapp_analytics/preprocess.py
- `estimate_cost()` --calls--> `canonical_ingredient()`  [EXTRACTED]
  analytics/snapp_analytics/analyze.py → analytics/snapp_analytics/preprocess.py
- `ingest()` --uses--> `SnappClient`  [INFERRED]
  analytics/snapp_analytics/api.py → analytics/snapp_analytics/client.py

## Import Cycles
- None detected.

## Communities (120 total, 33 thin omitted)

### Community 0 - "compilerOptions"
Cohesion: 0.08
Nodes (23): DOM, DOM.Iterable, ES2020, src, compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules (+15 more)

### Community 1 - "devDependencies"
Cohesion: 0.05
Nodes (40): autoprefixer, @fontsource/vazirmatn, lucide-react, dependencies, @fontsource/vazirmatn, lucide-react, react, react-dom (+32 more)

### Community 2 - "Cookify — Frontend Only / OpenCode"
Cohesion: 0.09
Nodes (21): Accessibility, Assistant `/assistant`, Community `/community`, Component Architecture, Cookify — Frontend Only / OpenCode, Create Result `/community/create`, Design, Implementation Order (+13 more)

### Community 3 - "compilerOptions"
Cohesion: 0.10
Nodes (19): ES2023, node, vite.config.ts, compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module (+11 more)

### Community 4 - "Store"
Cohesion: 0.06
Nodes (27): AppNotification, AuthResponse, loadDotEnv(), main(), EnsureRecipeImages(), EnsureUserLevels(), readSeed(), SeedIfEmpty() (+19 more)

### Community 5 - "reference_images"
Cohesion: 0.12
Nodes (16): import, name, note, reference_images, screens, assets-board.png, assistant-home.png, assistant-home.svg (+8 more)

### Community 6 - "types.ts"
Cohesion: 0.11
Nodes (19): AppNotification, AssistantRequest, AuthSession, ChatMessage, Comment, CommunityPost, CommunityPostView, Conversation (+11 more)

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

### Community 14 - "AssistantForm.tsx"
Cohesion: 0.40
Nodes (3): MEAL_TYPES, QUICK_INGREDIENTS, TIME_OPTIONS

### Community 16 - "ShoppingListContext.tsx"
Cohesion: 0.33
Nodes (3): DEFAULT_ITEMS, ShoppingListContext, ShoppingListContextValue

### Community 18 - "LandingPage.tsx"
Cohesion: 0.40
Nodes (3): FEATURES, STATS, STORES

### Community 68 - "AssistantPage.tsx"
Cohesion: 0.50
Nodes (4): AssistantPage(), FILTER_CHIPS, HOME_INGREDIENTS, parseSearchQuery()

### Community 78 - "CreateRecipePage.tsx"
Cohesion: 0.33
Nodes (4): CATEGORIES, DIFFICULTIES, IngRow, StepRow

### Community 81 - "foodIcons.ts"
Cohesion: 0.33
Nodes (3): Rule, RULES, TONES

### Community 85 - "banners.ts"
Cohesion: 0.40
Nodes (3): BANNERS, CategoryBanner, LOGO

### Community 91 - "images.ts"
Cohesion: 0.40
Nodes (3): RECIPE_IDS, recipeIdFromSeed(), recipePhoto()

### Community 92 - "AuthContext.tsx"
Cohesion: 0.33
Nodes (3): AuthContext, AuthContextValue, GUEST_USER

### Community 94 - "messages.ts"
Cohesion: 0.50
Nodes (3): ChatMessage, Conversation, conversations

### Community 102 - "API"
Cohesion: 0.13
Nodes (9): API, currentUser(), User, NewRouter(), writeError(), writeJSON(), github.com/gin-gonic/gin.Context, github.com/gin-gonic/gin.Engine (+1 more)

### Community 103 - "models.go"
Cohesion: 0.13
Nodes (20): AppNotification, AssistantRequest, ChatMessage, Comment, CommunityPost, CommunityPostView, ContactMessage, Conversation (+12 more)

### Community 104 - "client.ts"
Cohesion: 0.39
Nodes (5): apiBase(), ApiError, getToken(), request(), requestForm()

### Community 105 - "Cookify API — Gin + GORM + PostgreSQL"
Cohesion: 0.25
Nodes (7): Auth, Community / Users, Cookify API — Gin + GORM + PostgreSQL, Messages / Notifications / Contact, Products / Shopping, Recipes / Assistant, اجرا

### Community 106 - "Recommend"
Cohesion: 0.39
Nodes (8): AssistantRequest, Recipe, recipeTextHit(), Recommend(), textHit(), tokenizeQuery(), uniq(), Recommendation

### Community 113 - "api.py"
Cohesion: 0.06
Nodes (72): estimate_cost(), estimate_from_packs(), match_name(), _median(), Any, Local grocery-aware ranking (not first substring hit)., _specific_tokens(), stats() (+64 more)

### Community 114 - "Snapp"
Cohesion: 0.11
Nodes (35): analyticsURL(), enqueueProducts(), Product, postAnalyticsQueue(), containsAny(), entityAdjust(), foldFa(), Product (+27 more)

### Community 115 - "classify.py"
Cohesion: 0.10
Nodes (32): active_model(), _apply_known_ingredient(), _catalog(), _chat_ids(), classify_title(), classify_with_lmstudio(), loaded_models(), merge_classification() (+24 more)

## Knowledge Gaps
- **207 isolated node(s):** `cookify/backend`, `Product`, `ShoppingListItem`, `AssistantRequest`, `AppNotification` (+202 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **33 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `Snapp`, `API`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `API` connect `API` to `Store`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `Snapp` connect `Snapp` to `Store`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `cookify/backend`, `Product`, `ShoppingListItem` to the rest of the system?**
  _207 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._
- **Should `Cookify — Frontend Only / OpenCode` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._