package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type API struct {
	store *Store
}

func NewRouter(store *Store) *gin.Engine {
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(cors.New(cors.Config{
		AllowAllOrigins:  true,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Authorization", "Content-Type"},
		AllowCredentials: false,
	}))
	r.Static("/static", "./static")

	api := &API{store: store}
	g := r.Group("/api")
	g.GET("/health", api.health)

	g.POST("/auth/login", api.login)
	g.POST("/auth/register", api.register)
	g.POST("/auth/logout", api.logout)
	g.GET("/auth/user", api.chatUser)
	g.GET("/auth/me", api.requireAuth(), api.me)
	g.PATCH("/auth/me", api.requireAuth(), api.updateMe)
	g.POST("/auth/me/avatar", api.requireAuth(), api.uploadAvatar)

	g.GET("/recipes", api.listRecipes)
	g.GET("/recipes/popular", api.popularRecipes)
	g.GET("/recipes/:id", api.getRecipe)
	g.POST("/recipes/:id/reviews", api.requireAuth(), api.addReview)
	g.POST("/recipes/:id/save", api.requireAuth(), api.toggleSaved)

	g.POST("/assistant/recommend", api.recommend)

	g.GET("/catalog/categories", api.catalogCategories)
	g.GET("/catalog/categories/:id/ingredients", api.catalogIngredients)
	g.GET("/products", api.listProducts)
	g.POST("/products/match", api.matchProducts)
	g.POST("/products/choice", api.recordChoice)
	g.GET("/products/:id", api.getProduct)

	auth := g.Group("")
	auth.Use(api.requireAuth())
	{
		auth.GET("/shopping-list", api.getShopping)
		auth.PUT("/shopping-list", api.putShopping)
		auth.DELETE("/shopping-list", api.clearShopping)
		auth.POST("/shopping-list/items", api.addShoppingItem)
		auth.PATCH("/shopping-list/items/:id", api.patchShoppingItem)
		auth.DELETE("/shopping-list/items/:id", api.deleteShoppingItem)
		auth.POST("/shopping-list/from-recipe", api.shoppingFromRecipe)

		auth.POST("/recipes", api.requirePublisher(), api.createRecipe)
		auth.POST("/recipes/:id/image", api.requirePublisher(), api.uploadRecipeImage)

		auth.POST("/community/posts", api.publishPost)
		auth.POST("/community/posts/:id/like", api.likePost)
		auth.POST("/community/posts/:id/comments", api.commentPost)

		auth.POST("/users/:username/follow", api.followUser)
		auth.GET("/me/saved-recipes", api.savedRecipes)
		auth.GET("/me/following", api.following)

		auth.GET("/messages", api.listMessages)
		auth.GET("/messages/:id", api.getConversation)
		auth.POST("/messages/:id", api.sendMessage)

		auth.GET("/notifications", api.listNotifications)
		auth.POST("/notifications/read-all", api.readAllNotifications)
		auth.POST("/notifications/:id/read", api.readNotification)
	}

	g.GET("/community/posts", api.listPosts)
	g.GET("/community/posts/:id", api.getPost)
	g.GET("/users", api.listUsers)
	g.GET("/users/:username/following", api.userFollowing)
	g.GET("/users/:username/followers", api.userFollowers)
	g.GET("/users/:username", api.getUser)
	g.POST("/contact", api.contact)

	g.POST("/cook-sessions", api.startCookSession)
	g.GET("/cook-sessions/active", api.getCookSession)
	g.DELETE("/cook-sessions/:id", api.stopCookSession)

	admin := g.Group("/admin")
	admin.Use(api.requireAuth(), api.requireStaff())
	{
		admin.GET("/summary", api.adminSummary)
		admin.GET("/contacts", api.adminContacts)
		admin.PATCH("/users/:id", api.adminUpdateUser)
		admin.POST("/recipes", api.adminCreateRecipe)
		admin.PATCH("/recipes/:id", api.adminUpdateRecipe)
		admin.DELETE("/recipes/:id", api.adminDeleteRecipe)
		admin.PATCH("/posts/:id", api.adminUpdatePost)
		admin.DELETE("/posts/:id", api.adminDeletePost)
	}

	return r
}

func writeJSON(c *gin.Context, status int, data any) {
	c.JSON(status, gin.H{"data": data})
}

func writeError(c *gin.Context, status int, msg string) {
	c.JSON(status, gin.H{"error": msg})
}

func (a *API) userFromHeader(c *gin.Context) (User, bool) {
	h := c.GetHeader("Authorization")
	if !strings.HasPrefix(h, "Bearer ") {
		return User{}, false
	}
	return a.store.UserByToken(strings.TrimSpace(strings.TrimPrefix(h, "Bearer ")))
}

func (a *API) requireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		u, ok := a.userFromHeader(c)
		if !ok {
			writeError(c, http.StatusUnauthorized, "وارد حساب کاربری شوید")
			c.Abort()
			return
		}
		c.Set("user", u)
		c.Next()
	}
}

func (a *API) requireStaff() gin.HandlerFunc {
	return func(c *gin.Context) {
		if currentUser(c).Level != "staff" {
			writeError(c, http.StatusForbidden, "فقط حساب staff به بک‌آفیس دسترسی دارد")
			c.Abort()
			return
		}
		c.Next()
	}
}

func (a *API) requirePublisher() gin.HandlerFunc {
	return func(c *gin.Context) {
		if !currentUser(c).CanPublishRecipes() {
			writeError(c, http.StatusForbidden, "فقط Cookify و سرآشپزها می‌توانند دستور غذا ثبت کنند")
			c.Abort()
			return
		}
		c.Next()
	}
}

func currentUser(c *gin.Context) User {
	v, _ := c.Get("user")
	u, _ := v.(User)
	return u
}

func (a *API) health(c *gin.Context) {
	writeJSON(c, http.StatusOK, gin.H{"status": "ok"})
}

func (a *API) login(c *gin.Context) {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		writeError(c, http.StatusBadRequest, "بدنه درخواست نامعتبر است")
		return
	}
	res, err := a.store.Login(body.Email, body.Password)
	if err != nil {
		writeError(c, http.StatusUnauthorized, err.Error())
		return
	}
	writeJSON(c, http.StatusOK, res)
}

func (a *API) register(c *gin.Context) {
	var body struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		writeError(c, http.StatusBadRequest, "بدنه درخواست نامعتبر است")
		return
	}
	if strings.TrimSpace(body.Name) == "" || strings.TrimSpace(body.Email) == "" {
		writeError(c, http.StatusBadRequest, "نام و ایمیل الزامی است")
		return
	}
	res, err := a.store.Register(body.Name, body.Email, body.Password)
	if err != nil {
		writeError(c, http.StatusConflict, err.Error())
		return
	}
	writeJSON(c, http.StatusCreated, res)
}

func (a *API) logout(c *gin.Context) {
	h := c.GetHeader("Authorization")
	a.store.Logout(strings.TrimSpace(strings.TrimPrefix(h, "Bearer ")))
	writeJSON(c, http.StatusOK, gin.H{"ok": true})
}

func (a *API) me(c *gin.Context) {
	writeJSON(c, http.StatusOK, currentUser(c))
}

// chatUser is the identity payload chat-realtime expects from GATEWAY_URL/api/auth/user.
func (a *API) chatUser(c *gin.Context) {
	raw := strings.TrimSpace(c.GetHeader("Authorization"))
	raw = strings.TrimSpace(strings.TrimPrefix(raw, "Bearer "))
	u, ok := a.store.UserByToken(raw)
	if !ok || u.ChatID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	first, last := u.Name, ""
	if parts := strings.Fields(u.Name); len(parts) > 1 {
		first = parts[0]
		last = strings.Join(parts[1:], " ")
	}
	c.JSON(http.StatusOK, gin.H{
		"id":        u.ChatID,
		"firstname": first,
		"lastname":  last,
		"username":  u.Username,
		"avatar":    u.Avatar,
	})
}

func (a *API) updateMe(c *gin.Context) {
	var body struct {
		Name string `json:"name"`
		Bio  string `json:"bio"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		writeError(c, http.StatusBadRequest, "بدنه درخواست نامعتبر است")
		return
	}
	u, err := a.store.UpdateProfile(currentUser(c).ID, body.Name, body.Bio)
	if err != nil {
		writeError(c, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(c, http.StatusOK, u)
}

func (a *API) uploadAvatar(c *gin.Context) {
	file, err := c.FormFile("avatar")
	if err != nil {
		writeError(c, http.StatusBadRequest, "تصویر را انتخاب کن")
		return
	}
	if file.Size > 2*1024*1024 {
		writeError(c, http.StatusBadRequest, "حجم تصویر باید کمتر از ۲ مگابایت باشد")
		return
	}
	ext := strings.ToLower(filepath.Ext(file.Filename))
	switch ext {
	case ".jpg", ".jpeg", ".png", ".webp":
	default:
		writeError(c, http.StatusBadRequest, "فقط JPG، PNG یا WEBP مجاز است")
		return
	}
	if ext == ".jpeg" {
		ext = ".jpg"
	}
	if err := os.MkdirAll("static/avatars", 0o755); err != nil {
		writeError(c, http.StatusInternalServerError, "ذخیره تصویر انجام نشد")
		return
	}
	u := currentUser(c)
	name := u.ID + ext
	dest := filepath.Join("static", "avatars", name)
	if err := c.SaveUploadedFile(file, dest); err != nil {
		writeError(c, http.StatusInternalServerError, "ذخیره تصویر انجام نشد")
		return
	}
	url := fmt.Sprintf("/static/avatars/%s?v=%d", name, time.Now().Unix())
	saved, err := a.store.SetAvatar(u.ID, url)
	if err != nil {
		writeError(c, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(c, http.StatusOK, saved)
}

func (a *API) listRecipes(c *gin.Context) {
	limit, _ := strconv.Atoi(c.Query("limit"))
	writeJSON(c, http.StatusOK, a.store.ListRecipes(
		c.Query("q"), c.Query("category"), c.Query("tag"), c.Query("cuisine"), limit,
	))
}

func (a *API) popularRecipes(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "5"))
	writeJSON(c, http.StatusOK, a.store.PopularRecipes(limit))
}

func (a *API) getRecipe(c *gin.Context) {
	recipe, ok := a.store.RecipeByID(c.Param("id"))
	if !ok {
		writeError(c, http.StatusNotFound, "دستور پخت پیدا نشد")
		return
	}
	writeJSON(c, http.StatusOK, recipe)
}

func (a *API) createRecipe(c *gin.Context) {
	var draft Recipe
	if err := c.ShouldBindJSON(&draft); err != nil {
		writeError(c, http.StatusBadRequest, "بدنه درخواست نامعتبر است")
		return
	}
	recipe, err := a.store.CreateRecipe(currentUser(c), draft)
	if err != nil {
		writeError(c, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(c, http.StatusCreated, recipe)
}

func (a *API) uploadRecipeImage(c *gin.Context) {
	file, err := c.FormFile("image")
	if err != nil {
		writeError(c, http.StatusBadRequest, "تصویر را انتخاب کن")
		return
	}
	if file.Size > 4*1024*1024 {
		writeError(c, http.StatusBadRequest, "حجم تصویر باید کمتر از ۴ مگابایت باشد")
		return
	}
	ext := strings.ToLower(filepath.Ext(file.Filename))
	switch ext {
	case ".jpg", ".jpeg", ".png", ".webp":
	default:
		writeError(c, http.StatusBadRequest, "فقط JPG، PNG یا WEBP مجاز است")
		return
	}
	if ext == ".jpeg" {
		ext = ".jpg"
	}
	if err := os.MkdirAll("static/recipes", 0o755); err != nil {
		writeError(c, http.StatusInternalServerError, "ذخیره تصویر انجام نشد")
		return
	}
	u := currentUser(c)
	name := c.Param("id") + ext
	dest := filepath.Join("static", "recipes", name)
	if err := c.SaveUploadedFile(file, dest); err != nil {
		writeError(c, http.StatusInternalServerError, "ذخیره تصویر انجام نشد")
		return
	}
	url := fmt.Sprintf("/static/recipes/%s?v=%d", name, time.Now().Unix())
	saved, err := a.store.SetRecipeImage(c.Param("id"), u.ID, url, u.Level)
	if err != nil {
		writeError(c, http.StatusForbidden, err.Error())
		return
	}
	writeJSON(c, http.StatusOK, saved)
}

func (a *API) addReview(c *gin.Context) {
	u := currentUser(c)
	var body struct {
		Rating  int    `json:"rating"`
		Comment string `json:"comment"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		writeError(c, http.StatusBadRequest, "بدنه درخواست نامعتبر است")
		return
	}
	recipe, err := a.store.AddReview(c.Param("id"), u.ID, u.Name, body.Comment, body.Rating)
	if err != nil {
		writeError(c, http.StatusNotFound, err.Error())
		return
	}
	writeJSON(c, http.StatusCreated, recipe)
}

func (a *API) toggleSaved(c *gin.Context) {
	saved, err := a.store.ToggleSaved(currentUser(c).ID, c.Param("id"))
	if err != nil {
		writeError(c, http.StatusNotFound, err.Error())
		return
	}
	writeJSON(c, http.StatusOK, gin.H{"saved": saved})
}

func (a *API) recommend(c *gin.Context) {
	var req AssistantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		writeError(c, http.StatusBadRequest, "بدنه درخواست نامعتبر است")
		return
	}
	if req.TimeMinutes == 0 {
		req.TimeMinutes = 30
	}
	if req.Servings == 0 {
		req.Servings = 4
	}
	writeJSON(c, http.StatusOK, Recommend(a.store.ListRecipes("", "", "", "", 0), req))
}

func (a *API) catalogCategories(c *gin.Context) {
	tree, err := a.store.CatalogCategories()
	if err != nil {
		writeError(c, http.StatusInternalServerError, "دسته‌بندی مواد خوانده نشد")
		return
	}
	writeJSON(c, http.StatusOK, tree)
}

func (a *API) catalogIngredients(c *gin.Context) {
	names, err := a.store.CatalogIngredients(c.Param("id"))
	if err != nil {
		writeError(c, http.StatusInternalServerError, "نام مواد خوانده نشد")
		return
	}
	if names == nil {
		names = []string{}
	}
	writeJSON(c, http.StatusOK, names)
}

func (a *API) listProducts(c *gin.Context) {
	q := strings.TrimSpace(c.Query("q"))
	if q == "" {
		writeJSON(c, http.StatusOK, a.store.ListProducts())
		return
	}
	if a.store.snapp == nil {
		writeError(c, http.StatusBadGateway, "سرویس اسنپ‌مارکت فعال نیست")
		return
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))
	items, err := a.store.snapp.Search(q, c.Query("lat"), c.Query("long"), page, size)
	if err != nil {
		writeError(c, http.StatusBadGateway, err.Error())
		return
	}
	writeJSON(c, http.StatusOK, items)
}

func (a *API) matchProducts(c *gin.Context) {
	var body struct {
		Names []string `json:"names"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		writeError(c, http.StatusBadRequest, "بدنه درخواست نامعتبر است")
		return
	}
	if a.store.snapp == nil {
		writeError(c, http.StatusBadGateway, "سرویس اسنپ‌مارکت فعال نیست")
		return
	}
	found := matchFromCatalog(body.Names)
	have := map[string]bool{}
	for _, p := range found {
		for _, name := range p.Matches {
			have[name] = true
		}
	}
	missing := make([]string, 0)
	for _, name := range body.Names {
		name = strings.TrimSpace(name)
		if name != "" && !have[name] {
			missing = append(missing, name)
		}
	}
	if len(missing) > 0 {
		found = append(found, a.store.snapp.MatchMany(missing)...)
	}
	writeJSON(c, http.StatusOK, found)
}

func (a *API) recordChoice(c *gin.Context) {
	var body struct {
		Ingredient string `json:"ingredient"`
		ProductID  string `json:"productId"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || strings.TrimSpace(body.Ingredient) == "" || strings.TrimSpace(body.ProductID) == "" {
		writeError(c, http.StatusBadRequest, "انتخاب نامعتبر است")
		return
	}
	payload, _ := json.Marshal(map[string]string{
		"ingredient": strings.TrimSpace(body.Ingredient),
		"product_id": strings.TrimSpace(body.ProductID),
	})
	req, err := http.NewRequest(http.MethodPost, analyticsURL()+"/catalog/choice", bytes.NewReader(payload))
	if err != nil {
		writeError(c, http.StatusBadGateway, "ثبت انتخاب انجام نشد")
		return
	}
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{Timeout: 3 * time.Second}
	res, err := client.Do(req)
	if err != nil {
		writeError(c, http.StatusBadGateway, "ثبت انتخاب انجام نشد")
		return
	}
	defer res.Body.Close()
	writeJSON(c, http.StatusOK, gin.H{"status": "ok"})
}

func (a *API) getProduct(c *gin.Context) {
	p, ok := a.store.ProductByID(c.Param("id"))
	if !ok {
		writeError(c, http.StatusNotFound, "محصول پیدا نشد")
		return
	}
	writeJSON(c, http.StatusOK, p)
}

func (a *API) getShopping(c *gin.Context) {
	writeJSON(c, http.StatusOK, a.store.Shopping(currentUser(c).ID))
}

func (a *API) putShopping(c *gin.Context) {
	var items []ShoppingListItem
	if err := c.ShouldBindJSON(&items); err != nil {
		writeError(c, http.StatusBadRequest, "بدنه درخواست نامعتبر است")
		return
	}
	writeJSON(c, http.StatusOK, a.store.ReplaceShopping(currentUser(c).ID, items))
}

func (a *API) clearShopping(c *gin.Context) {
	a.store.ClearShopping(currentUser(c).ID)
	writeJSON(c, http.StatusOK, []ShoppingListItem{})
}

func (a *API) addShoppingItem(c *gin.Context) {
	var item ShoppingListItem
	if err := c.ShouldBindJSON(&item); err != nil {
		writeError(c, http.StatusBadRequest, "بدنه درخواست نامعتبر است")
		return
	}
	writeJSON(c, http.StatusCreated, a.store.AddShoppingItem(currentUser(c).ID, item))
}

func (a *API) patchShoppingItem(c *gin.Context) {
	var body struct {
		Amount  *float64 `json:"amount"`
		Checked *bool    `json:"checked"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		writeError(c, http.StatusBadRequest, "بدنه درخواست نامعتبر است")
		return
	}
	items, err := a.store.PatchShoppingItem(currentUser(c).ID, c.Param("id"), body.Amount, body.Checked)
	if err != nil {
		writeError(c, http.StatusNotFound, err.Error())
		return
	}
	writeJSON(c, http.StatusOK, items)
}

func (a *API) deleteShoppingItem(c *gin.Context) {
	items, err := a.store.RemoveShoppingItem(currentUser(c).ID, c.Param("id"))
	if err != nil {
		writeError(c, http.StatusNotFound, err.Error())
		return
	}
	writeJSON(c, http.StatusOK, items)
}

func (a *API) shoppingFromRecipe(c *gin.Context) {
	var body struct {
		RecipeID string `json:"recipeId"`
		Servings int    `json:"servings"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		writeError(c, http.StatusBadRequest, "بدنه درخواست نامعتبر است")
		return
	}
	items, err := a.store.AddRecipeToShopping(currentUser(c).ID, body.RecipeID, body.Servings)
	if err != nil {
		writeError(c, http.StatusNotFound, err.Error())
		return
	}
	writeJSON(c, http.StatusOK, items)
}

func (a *API) listPosts(c *gin.Context) {
	viewerID := ""
	if u, ok := a.userFromHeader(c); ok {
		viewerID = u.ID
	}
	writeJSON(c, http.StatusOK, a.store.ListPosts(c.Query("tab"), viewerID))
}

func (a *API) getPost(c *gin.Context) {
	viewerID := ""
	if u, ok := a.userFromHeader(c); ok {
		viewerID = u.ID
	}
	post, ok := a.store.PostByID(c.Param("id"), viewerID)
	if !ok {
		writeError(c, http.StatusNotFound, "پست پیدا نشد")
		return
	}
	writeJSON(c, http.StatusOK, post)
}

func (a *API) publishPost(c *gin.Context) {
	u := currentUser(c)
	var body struct {
		RecipeID   string  `json:"recipeId"`
		Caption    string  `json:"caption"`
		Suggestion string  `json:"suggestion"`
		Rating     float64 `json:"rating"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		writeError(c, http.StatusBadRequest, "بدنه درخواست نامعتبر است")
		return
	}
	post, err := a.store.Publish(u.ID, body.RecipeID, body.Caption, body.Suggestion, body.Rating)
	if err != nil {
		writeError(c, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(c, http.StatusCreated, post)
}

func (a *API) likePost(c *gin.Context) {
	post, liked, err := a.store.ToggleLike(currentUser(c).ID, c.Param("id"))
	if err != nil {
		writeError(c, http.StatusNotFound, err.Error())
		return
	}
	writeJSON(c, http.StatusOK, gin.H{"liked": liked, "post": post})
}

func (a *API) commentPost(c *gin.Context) {
	var body struct {
		Text string `json:"text"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || strings.TrimSpace(body.Text) == "" {
		writeError(c, http.StatusBadRequest, "متن نظر الزامی است")
		return
	}
	post, err := a.store.AddComment(currentUser(c).ID, c.Param("id"), strings.TrimSpace(body.Text))
	if err != nil {
		writeError(c, http.StatusNotFound, err.Error())
		return
	}
	writeJSON(c, http.StatusCreated, post)
}

func (a *API) listUsers(c *gin.Context) {
	writeJSON(c, http.StatusOK, a.store.ListUsers())
}

func (a *API) getUser(c *gin.Context) {
	u, ok := a.store.UserByUsername(c.Param("username"))
	if !ok {
		writeError(c, http.StatusNotFound, "کاربر پیدا نشد")
		return
	}
	writeJSON(c, http.StatusOK, u)
}

func (a *API) userFollowing(c *gin.Context) {
	u, ok := a.store.UserByUsername(c.Param("username"))
	if !ok {
		writeError(c, http.StatusNotFound, "کاربر پیدا نشد")
		return
	}
	writeJSON(c, http.StatusOK, a.store.FollowingUsers(u.ID))
}

func (a *API) userFollowers(c *gin.Context) {
	if _, ok := a.store.UserByUsername(c.Param("username")); !ok {
		writeError(c, http.StatusNotFound, "کاربر پیدا نشد")
		return
	}
	writeJSON(c, http.StatusOK, a.store.FollowersOf(c.Param("username")))
}

func (a *API) followUser(c *gin.Context) {
	following, err := a.store.ToggleFollow(currentUser(c).ID, c.Param("username"))
	if err != nil {
		writeError(c, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(c, http.StatusOK, gin.H{"following": following})
}

func (a *API) savedRecipes(c *gin.Context) {
	writeJSON(c, http.StatusOK, a.store.SavedRecipes(currentUser(c).ID))
}

func (a *API) following(c *gin.Context) {
	writeJSON(c, http.StatusOK, a.store.Following(currentUser(c).ID))
}

func (a *API) listMessages(c *gin.Context) {
	writeJSON(c, http.StatusOK, a.store.Conversations())
}

func (a *API) getConversation(c *gin.Context) {
	conv, ok := a.store.Conversation(c.Param("id"))
	if !ok {
		writeError(c, http.StatusNotFound, "گفتگو پیدا نشد")
		return
	}
	writeJSON(c, http.StatusOK, conv)
}

func (a *API) sendMessage(c *gin.Context) {
	var body struct {
		Text string `json:"text"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || strings.TrimSpace(body.Text) == "" {
		writeError(c, http.StatusBadRequest, "متن پیام الزامی است")
		return
	}
	conv, err := a.store.SendMessage(c.Param("id"), strings.TrimSpace(body.Text), true)
	if err != nil {
		writeError(c, http.StatusNotFound, err.Error())
		return
	}
	writeJSON(c, http.StatusCreated, conv)
}

func (a *API) listNotifications(c *gin.Context) {
	writeJSON(c, http.StatusOK, a.store.Notifications())
}

func (a *API) readNotification(c *gin.Context) {
	if err := a.store.MarkNotificationRead(c.Param("id")); err != nil {
		writeError(c, http.StatusNotFound, err.Error())
		return
	}
	writeJSON(c, http.StatusOK, a.store.Notifications())
}

func (a *API) readAllNotifications(c *gin.Context) {
	a.store.MarkAllNotificationsRead()
	writeJSON(c, http.StatusOK, a.store.Notifications())
}

func (a *API) contact(c *gin.Context) {
	var body struct {
		Name    string `json:"name"`
		Email   string `json:"email"`
		Message string `json:"message"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		writeError(c, http.StatusBadRequest, "بدنه درخواست نامعتبر است")
		return
	}
	if strings.TrimSpace(body.Name) == "" || strings.TrimSpace(body.Email) == "" || strings.TrimSpace(body.Message) == "" {
		writeError(c, http.StatusBadRequest, "نام، ایمیل و پیام الزامی است")
		return
	}
	writeJSON(c, http.StatusCreated, a.store.AddContact(body.Name, body.Email, body.Message))
}
