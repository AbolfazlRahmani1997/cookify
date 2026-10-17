# Graph Report - cookify_frontend_ui  (2026-09-25)

## Corpus Check
- 172 files · ~2,216,661 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1060 nodes · 1660 edges · 159 communities (117 shown, 42 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 69 edges (avg confidence: 0.83)
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
- MessagesPage.tsx
- github.com/gin-gonic/gin.Context
- models.go
- client.ts
- Cookify API — Gin + GORM + PostgreSQL
- Recommend
- cookify/backend
- api.py
- matchFromCatalog
- classify.py
- Cookify Snapp analytics
- __init__.py
- Snapp
- analyze.py
- store.py
- cli.py
- queue.py
- SnappClient
- AdminPage.tsx
- _Result
- RecipeForm.tsx
- chatRealtime.ts
- main
- dependencies
- CookScheduler
- newID
- Recipe
- .publicUser
- save_category_tree
- .enrich
- scripts
- ExampleInstrumentedTest.java
- CookSessionContext.tsx
- package.json
- gradlew
- signChatJWT
- ntfyTopic.ts
- MainActivity.java
- CookDock.tsx
- capacitor.config.ts
- @types/react
- android-env.sh
- cookWatch.ts

## God Nodes (most connected - your core abstractions)
1. `Store` - 77 edges
2. `writeJSON()` - 60 edges
3. `API` - 54 edges
4. `writeError()` - 47 edges
5. `connect()` - 28 edges
6. `currentUser()` - 26 edges
7. `Snapp` - 21 edges
8. `compilerOptions` - 18 edges
9. `preprocess_item()` - 16 edges
10. `Conn` - 16 edges

## Surprising Connections (you probably didn't know these)
- `_lifespan()` --uses--> `SnappClient`  [INFERRED]
  analytics/snapp_analytics/api.py → analytics/snapp_analytics/client.py
- `ingest()` --uses--> `SnappClient`  [INFERRED]
  analytics/snapp_analytics/api.py → analytics/snapp_analytics/client.py
- `main()` --calls--> `NewRouter()`  [INFERRED]
  backend/main.go → backend/http.go
- `main()` --calls--> `OpenDB()`  [INFERRED]
  backend/main.go → backend/store.go
- `NewSnapp()` --calls--> `newID()`  [INFERRED]
  backend/snapp.go → backend/store.go

## Import Cycles
- None detected.

## Communities (159 total, 42 thin omitted)

### Community 0 - "compilerOptions"
Cohesion: 0.08
Nodes (23): DOM, DOM.Iterable, ES2020, src, compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules (+15 more)

### Community 1 - "devDependencies"
Cohesion: 0.11
Nodes (19): autoprefixer, @capacitor/cli, devDependencies, autoprefixer, @capacitor/cli, postcss, tailwindcss, @types/node (+11 more)

### Community 2 - "Cookify — Frontend Only / OpenCode"
Cohesion: 0.09
Nodes (21): Accessibility, Assistant `/assistant`, Community `/community`, Component Architecture, Cookify — Frontend Only / OpenCode, Create Result `/community/create`, Design, Implementation Order (+13 more)

### Community 3 - "compilerOptions"
Cohesion: 0.10
Nodes (19): ES2023, node, vite.config.ts, compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module (+11 more)

### Community 4 - "Store"
Cohesion: 0.10
Nodes (7): AppNotification, CatalogCategory, Store, Product, OpenDB(), Conversation, gorm.io/gorm.DB

### Community 5 - "reference_images"
Cohesion: 0.12
Nodes (16): import, name, note, reference_images, screens, assets-board.png, assistant-home.png, assistant-home.svg (+8 more)

### Community 6 - "types.ts"
Cohesion: 0.10
Nodes (21): AdminSummary, AppNotification, AssistantRequest, AuthSession, ChatMessage, Comment, CommunityPost, CommunityPostView (+13 more)

### Community 7 - "format.ts"
Cohesion: 0.29
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
Cohesion: 0.29
Nodes (5): CatalogNode, CATEGORIES, DIFFICULTIES, IngRow, StepRow

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

### Community 101 - "MessagesPage.tsx"
Cohesion: 0.83
Nodes (3): byLatest(), dedupeRooms(), MessagesPage()

### Community 102 - "github.com/gin-gonic/gin.Context"
Cohesion: 0.10
Nodes (11): API, API, currentUser(), API, User, NewRouter(), writeError(), writeJSON() (+3 more)

### Community 103 - "models.go"
Cohesion: 0.13
Nodes (20): AppNotification, AssistantRequest, ChatMessage, Comment, CommunityPost, CommunityPostView, ContactMessage, Conversation (+12 more)

### Community 104 - "client.ts"
Cohesion: 0.29
Nodes (5): apiBase(), ApiError, getToken(), request(), requestForm()

### Community 105 - "Cookify API — Gin + GORM + PostgreSQL"
Cohesion: 0.25
Nodes (7): Auth, Community / Users, Cookify API — Gin + GORM + PostgreSQL, Messages / Notifications / Contact, Products / Shopping, Recipes / Assistant, اجرا

### Community 106 - "Recommend"
Cohesion: 0.39
Nodes (8): AssistantRequest, Recipe, recipeTextHit(), Recommend(), textHit(), tokenizeQuery(), uniq(), Recommendation

### Community 113 - "api.py"
Cohesion: 0.13
Nodes (30): record_choice(), catalog_choice(), catalog_match(), CatalogBody, ChoiceBody, classify(), ClassifyBody, _default_queries() (+22 more)

### Community 114 - "matchFromCatalog"
Cohesion: 0.25
Nodes (9): analyticsURL(), enqueueProducts(), Product, postAnalyticsQueue(), atoiID(), firstText(), Product, matchFromCatalog() (+1 more)

### Community 115 - "classify.py"
Cohesion: 0.09
Nodes (33): active_model(), _apply_known_ingredient(), _catalog(), _chat_ids(), classify_title(), classify_with_lmstudio(), lms_available(), loaded_models() (+25 more)

### Community 120 - "Snapp"
Cohesion: 0.13
Nodes (33): containsAny(), entityAdjust(), foldFa(), Product, groceryScore(), hasToken(), pickGroceryMatch(), processedInsteadOfCut() (+25 more)

### Community 121 - "analyze.py"
Cohesion: 0.16
Nodes (17): catalog_score(), choice_boosts(), choose_subcategory(), _covers(), estimate_from_packs(), match_name(), _median(), pick_catalog_product() (+9 more)

### Community 122 - "store.py"
Cohesion: 0.13
Nodes (18): _adopt_snapp_schema(), Conn, connect(), database_url(), _fill_app_products(), _fill_taxonomy_from_slug(), _import_sqlite_if_empty(), list_products() (+10 more)

### Community 123 - "cli.py"
Cohesion: 0.30
Nodes (14): estimate_cost(), stats(), cmd_classify(), cmd_estimate(), cmd_export(), cmd_ingest(), cmd_preprocess(), cmd_serve() (+6 more)

### Community 124 - "queue.py"
Cohesion: 0.32
Nodes (11): _claim(), enqueue_items(), _finish(), _now(), process_one(), Any, start_worker(), worker() (+3 more)

### Community 125 - "SnappClient"
Cohesion: 0.31
Nodes (3): Any, SnappClient, ensure_dirs()

### Community 127 - "_Result"
Cohesion: 0.25
Nodes (3): _Result, Row, dict

### Community 130 - "RecipeForm.tsx"
Cohesion: 0.29
Nodes (7): CatalogNode, CATEGORIES, DIFFICULTIES, fromRecipe(), Ing, RecipeForm(), Step

### Community 131 - "chatRealtime.ts"
Cohesion: 0.12
Nodes (14): asRecord(), ChatMessageKind, ChatQuote, ChatRoom, ChatRoomMessage, ChatSocket, chatToken(), chatWsUrl() (+6 more)

### Community 132 - "main"
Cohesion: 0.17
Nodes (13): AuthResponse, loadDotEnv(), main(), EnsureRecipeImages(), EnsureStaff(), EnsureUserLevels(), readSeed(), SeedIfEmpty() (+5 more)

### Community 133 - "dependencies"
Cohesion: 0.13
Nodes (15): @capacitor/android, @capacitor/core, @fontsource/vazirmatn, lucide-react, dependencies, @capacitor/android, @capacitor/core, @fontsource/vazirmatn (+7 more)

### Community 134 - "CookScheduler"
Cohesion: 0.19
Nodes (8): CookScheduler, CookSessionRow, ntfyBaseURL(), ntfyEnabled(), publishNtfy(), startCookBody, sync.Once, time.Time

### Community 135 - "newID"
Cohesion: 0.26
Nodes (4): newID(), roundAmount(), ContactMessage, ShoppingListItem

### Community 136 - "Recipe"
Cohesion: 0.26
Nodes (3): Recipe, recipeMatchesQuery(), recipeMatchesTag()

### Community 138 - "save_category_tree"
Cohesion: 0.22
Nodes (8): _lifespan(), category_node_id(), Any, Snapp sends a parent category id as a one-item list., Store the express-search category tree with Snapp's own ids., save_category_tree(), CategoryTreeTest, FastAPI

### Community 140 - "scripts"
Cohesion: 0.13
Nodes (15): scripts, android:apk, android:build, build, cap:open, cap:sync, dev, dev:lan (+7 more)

### Community 141 - "ExampleInstrumentedTest.java"
Cohesion: 0.33
Nodes (5): ExampleInstrumentedTest, ExampleUnitTest, androidx.test.ext.junit.runners.AndroidJUnit4, org.junit.runner.RunWith, org.junit.Test

### Community 142 - "CookSessionContext.tsx"
Cohesion: 0.33
Nodes (5): CookSession, CookSessionContext, CookSessionContextValue, CookSessionProvider(), readSession()

### Community 143 - "package.json"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 144 - "gradlew"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

### Community 145 - "signChatJWT"
Cohesion: 0.67
Nodes (3): User, jwtSecret(), signChatJWT()

### Community 151 - "android-env.sh"
Cohesion: 0.13
Nodes (10): ANDROID_HOME, ANDROID_SDK_ROOT, JAVA_HOME, PATH, android-env.sh script, build-android.sh script, emulator-install.sh script, CAP_SERVER_URL (+2 more)

## Knowledge Gaps
- **253 isolated node(s):** `catalogHit`, `startCookBody`, `cookify/backend`, `Product`, `ShoppingListItem` (+248 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **42 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Store` to `main`, `github.com/gin-gonic/gin.Context`, `CookScheduler`, `newID`, `Recipe`, `.publicUser`, `.enrich`, `Snapp`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `API` connect `github.com/gin-gonic/gin.Context` to `Store`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `Snapp` connect `Snapp` to `main`, `Store`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Are the 11 inferred relationships involving `writeJSON()` (e.g. with `.adminContacts()` and `.adminCreateRecipe()`) actually correct?**
  _`writeJSON()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Are the 9 inferred relationships involving `writeError()` (e.g. with `.adminCreateRecipe()` and `.adminDeletePost()`) actually correct?**
  _`writeError()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **What connects `catalogHit`, `startCookBody`, `cookify/backend` to the rest of the system?**
  _253 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._