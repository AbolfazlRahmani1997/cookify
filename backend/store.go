package main

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"math"
	"os"
	"sort"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type Store struct {
	db    *gorm.DB
	snapp *Snapp
}

func newID(prefix string) string {
	b := make([]byte, 8)
	_, _ = rand.Read(b)
	return prefix + hex.EncodeToString(b)
}

func hashPassword(plain string) (string, error) {
	b, err := bcrypt.GenerateFromPassword([]byte(plain), bcrypt.DefaultCost)
	return string(b), err
}

func checkPassword(hash, plain string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(plain)) == nil
}

func OpenDB() (*gorm.DB, error) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://cookify:cookify@localhost:5432/cookify?sslmode=disable"
	}
	return gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.New(log.New(os.Stdout, "", log.LstdFlags), logger.Config{
			SlowThreshold:             time.Second,
			LogLevel:                  logger.Warn,
			IgnoreRecordNotFoundError: true,
			Colorful:                  false,
		}),
	})
}

func (s *Store) AutoMigrate() error {
	if err := s.db.AutoMigrate(
		&User{},
		&Recipe{},
		&Product{},
		&CommunityPost{},
		&ShoppingListItem{},
		&Conversation{},
		&AppNotification{},
		&ContactMessage{},
		&Session{},
		&PostLike{},
		&Follow{},
		&SavedRecipe{},
		&CookSessionRow{},
	); err != nil {
		return err
	}
	return s.assignChatIDs()
}

func (s *Store) assignChatIDs() error {
	var maxID int
	if err := s.db.Model(&User{}).Select("COALESCE(MAX(chat_id), 0)").Scan(&maxID).Error; err != nil {
		return err
	}
	var missing []User
	if err := s.db.Where("chat_id = 0 OR chat_id IS NULL").Find(&missing).Error; err != nil {
		return err
	}
	for _, u := range missing {
		maxID++
		if err := s.db.Model(&User{}).Where("id = ?", u.ID).Update("chat_id", maxID).Error; err != nil {
			return err
		}
	}
	return nil
}

func (s *Store) publicUser(u User) User {
	var saved []SavedRecipe
	_ = s.db.Where("user_id = ?", u.ID).Find(&saved).Error
	ids := make([]string, 0, len(saved))
	for _, row := range saved {
		ids = append(ids, row.RecipeID)
	}
	sort.Strings(ids)
	u.SavedRecipeIDs = ids
	u.PasswordHash = ""
	if u.Level == "" {
		u.Level = "cook"
	}
	u.ChatJWT = signChatJWT(u)
	return u
}

func (s *Store) Login(email, password string) (AuthResponse, error) {
	var u User
	email = strings.ToLower(strings.TrimSpace(email))
	if err := s.db.Where("email = ?", email).First(&u).Error; err != nil {
		return AuthResponse{}, fmt.Errorf("ایمیل یا رمز عبور نادرست است")
	}
	if !checkPassword(u.PasswordHash, password) {
		return AuthResponse{}, fmt.Errorf("ایمیل یا رمز عبور نادرست است")
	}
	token := newID("tok_")
	if err := s.db.Create(&Session{Token: token, UserID: u.ID}).Error; err != nil {
		return AuthResponse{}, err
	}
	return AuthResponse{Token: token, User: s.publicUser(u)}, nil
}

func (s *Store) Register(name, email, password string) (AuthResponse, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	if len(password) < 6 {
		return AuthResponse{}, fmt.Errorf("رمز عبور باید حداقل ۶ کاراکتر باشد")
	}
	var n int64
	s.db.Model(&User{}).Where("email = ?", email).Count(&n)
	if n > 0 {
		return AuthResponse{}, fmt.Errorf("این ایمیل قبلاً ثبت شده است")
	}
	hash, err := hashPassword(password)
	if err != nil {
		return AuthResponse{}, err
	}
	username := strings.Split(email, "@")[0]
	u := User{
		ID:           newID("u"),
		Username:     username,
		Name:         name,
		Email:        email,
		PasswordHash: hash,
		Level:        "cook",
	}
	if err := s.db.Create(&u).Error; err != nil {
		return AuthResponse{}, err
	}
	if err := s.assignChatIDs(); err != nil {
		return AuthResponse{}, err
	}
	_ = s.db.First(&u, "id = ?", u.ID).Error
	token := newID("tok_")
	if err := s.db.Create(&Session{Token: token, UserID: u.ID}).Error; err != nil {
		return AuthResponse{}, err
	}
	u.SavedRecipeIDs = []string{}
	return AuthResponse{Token: token, User: u}, nil
}

func (s *Store) Logout(token string) {
	if token == "" {
		return
	}
	s.db.Delete(&Session{}, "token = ?", token)
}

func (s *Store) UserByToken(token string) (User, bool) {
	var sess Session
	if err := s.db.Where("token = ?", token).First(&sess).Error; err != nil {
		return User{}, false
	}
	var u User
	if err := s.db.First(&u, "id = ?", sess.UserID).Error; err != nil {
		return User{}, false
	}
	return s.publicUser(u), true
}

func recipeMatchesQuery(r Recipe, q string) bool {
	if strings.Contains(r.Title, q) || strings.Contains(r.Description, q) || strings.Contains(r.Cuisine, q) {
		return true
	}
	for _, t := range r.Tags {
		if strings.Contains(t, q) {
			return true
		}
	}
	for _, ing := range r.Ingredients {
		if strings.Contains(ing.Name, q) {
			return true
		}
	}
	return false
}

func recipeMatchesTag(r Recipe, tag string) bool {
	switch tag {
	case "autumn":
		titles := map[string]bool{"آش رشته": true, "قورمه سبزی": true, "سوپ جو": true, "عدس پلو": true}
		if titles[r.Title] {
			return true
		}
		for _, t := range r.Tags {
			if strings.Contains(t, "سنتی") || strings.Contains(t, "خورشت") {
				return true
			}
		}
		return false
	case "desserts":
		return r.Category == "دسر"
	case "healthy":
		if r.Category == "سالاد" {
			return true
		}
		for _, t := range r.Tags {
			if strings.Contains(t, "رژیمی") || strings.Contains(t, "سالم") {
				return true
			}
		}
		return false
	case "breakfast":
		return r.Category == "صبحانه"
	default:
		for _, t := range r.Tags {
			if t == tag {
				return true
			}
		}
		return false
	}
}

func (s *Store) ListRecipes(q, category, tag, cuisine string, limit int) []Recipe {
	var all []Recipe
	tx := s.db.Model(&Recipe{})
	if category != "" && category != "all" {
		tx = tx.Where("category = ?", category)
	}
	if cuisine != "" {
		tx = tx.Where("cuisine = ?", cuisine)
	}
	_ = tx.Find(&all).Error
	q = strings.TrimSpace(q)
	out := make([]Recipe, 0, len(all))
	for _, r := range all {
		if tag != "" && !recipeMatchesTag(r, tag) {
			continue
		}
		if q != "" && !recipeMatchesQuery(r, q) {
			continue
		}
		out = append(out, r)
	}
	if limit > 0 && len(out) > limit {
		out = out[:limit]
	}
	return out
}

func (s *Store) PopularRecipes(limit int) []Recipe {
	if limit <= 0 {
		limit = 5
	}
	var out []Recipe
	s.db.Order("rating desc").Limit(limit).Find(&out)
	return out
}

func (s *Store) RecipeByID(id string) (Recipe, bool) {
	var r Recipe
	err := s.db.Where("id = ? OR slug = ?", id, id).First(&r).Error
	return r, err == nil
}

func (s *Store) CreateRecipe(author User, draft Recipe) (Recipe, error) {
	if !author.CanPublishRecipes() {
		return Recipe{}, fmt.Errorf("فقط Cookify و سرآشپزها می‌توانند دستور غذا ثبت کنند")
	}
	title := strings.TrimSpace(draft.Title)
	if title == "" {
		return Recipe{}, fmt.Errorf("عنوان دستور الزامی است")
	}
	if len(draft.Ingredients) == 0 {
		return Recipe{}, fmt.Errorf("حداقل یک ماده لازم است")
	}
	if len(draft.Steps) == 0 {
		return Recipe{}, fmt.Errorf("حداقل یک مرحله لازم است")
	}
	id := newID("r")
	if draft.Servings <= 0 {
		draft.Servings = 4
	}
	if draft.TimeMinutes <= 0 {
		draft.TimeMinutes = 30
	}
	if draft.Difficulty == "" {
		draft.Difficulty = "متوسط"
	}
	if draft.Category == "" {
		draft.Category = "غذای اصلی"
	}
	if draft.Tags == nil {
		draft.Tags = []string{}
	}
	if draft.Tips == nil {
		draft.Tips = []string{}
	}
	for i := range draft.Ingredients {
		if draft.Ingredients[i].ID == "" {
			draft.Ingredients[i].ID = fmt.Sprintf("%s-i%d", id, i+1)
		}
	}
	for i := range draft.Steps {
		if draft.Steps[i].ID == "" {
			draft.Steps[i].ID = fmt.Sprintf("%s-s%d", id, i+1)
		}
		if draft.Steps[i].Order == 0 {
			draft.Steps[i].Order = i + 1
		}
	}
	recipe := Recipe{
		ID:             id,
		Slug:           id,
		Title:          title,
		Description:    strings.TrimSpace(draft.Description),
		Category:       draft.Category,
		Cuisine:        strings.TrimSpace(draft.Cuisine),
		Servings:       draft.Servings,
		TimeMinutes:    draft.TimeMinutes,
		PrepMinutes:    draft.PrepMinutes,
		Difficulty:     draft.Difficulty,
		Calories:       draft.Calories,
		Tags:           draft.Tags,
		Ingredients:    draft.Ingredients,
		Steps:          draft.Steps,
		Tips:           draft.Tips,
		Reviews:        []Review{},
		AuthorID:       author.ID,
		AuthorUsername: author.Username,
		AuthorName:     author.Name,
	}
	if err := s.db.Create(&recipe).Error; err != nil {
		return Recipe{}, err
	}
	return recipe, nil
}

func (s *Store) UpdateRecipe(id string, draft Recipe) (Recipe, error) {
	r, ok := s.RecipeByID(id)
	if !ok {
		return Recipe{}, fmt.Errorf("دستور پیدا نشد")
	}
	title := strings.TrimSpace(draft.Title)
	if title == "" {
		return Recipe{}, fmt.Errorf("عنوان دستور الزامی است")
	}
	if len(draft.Ingredients) == 0 {
		return Recipe{}, fmt.Errorf("حداقل یک ماده لازم است")
	}
	if len(draft.Steps) == 0 {
		return Recipe{}, fmt.Errorf("حداقل یک مرحله لازم است")
	}
	if draft.Servings <= 0 {
		draft.Servings = r.Servings
	}
	if draft.TimeMinutes <= 0 {
		draft.TimeMinutes = r.TimeMinutes
	}
	if draft.Difficulty == "" {
		draft.Difficulty = r.Difficulty
	}
	if draft.Category == "" {
		draft.Category = r.Category
	}
	if draft.Tags == nil {
		draft.Tags = []string{}
	}
	if draft.Tips == nil {
		draft.Tips = []string{}
	}
	for i := range draft.Ingredients {
		if draft.Ingredients[i].ID == "" {
			draft.Ingredients[i].ID = fmt.Sprintf("%s-i%d", r.ID, i+1)
		}
	}
	for i := range draft.Steps {
		if draft.Steps[i].ID == "" {
			draft.Steps[i].ID = fmt.Sprintf("%s-s%d", r.ID, i+1)
		}
		draft.Steps[i].Order = i + 1
	}
	r.Title = title
	r.Description = strings.TrimSpace(draft.Description)
	r.Category = draft.Category
	r.Cuisine = strings.TrimSpace(draft.Cuisine)
	r.Servings = draft.Servings
	r.TimeMinutes = draft.TimeMinutes
	r.PrepMinutes = draft.PrepMinutes
	r.Difficulty = draft.Difficulty
	r.Calories = draft.Calories
	r.Tags = draft.Tags
	r.Ingredients = draft.Ingredients
	r.Steps = draft.Steps
	r.Tips = draft.Tips
	if err := s.db.Save(&r).Error; err != nil {
		return Recipe{}, err
	}
	return r, nil
}

func (s *Store) SetRecipeImage(recipeID, authorID, url, level string) (Recipe, error) {
	r, ok := s.RecipeByID(recipeID)
	if !ok {
		return Recipe{}, fmt.Errorf("دستور پخت پیدا نشد")
	}
	if level != "staff" && r.AuthorID != authorID {
		return Recipe{}, fmt.Errorf("اجازه ویرایش این دستور را نداری")
	}
	if err := s.db.Model(&Recipe{}).Where("id = ?", r.ID).Update("image", url).Error; err != nil {
		return Recipe{}, err
	}
	r.Image = url
	return r, nil
}

func (s *Store) AddReview(recipeID, userID, userName, comment string, rating int) (Recipe, error) {
	r, ok := s.RecipeByID(recipeID)
	if !ok {
		return Recipe{}, fmt.Errorf("دستور پخت پیدا نشد")
	}
	if rating < 1 {
		rating = 1
	}
	if rating > 5 {
		rating = 5
	}
	r.Reviews = append(r.Reviews, Review{
		ID:        newID("rv_"),
		UserID:    userID,
		UserName:  userName,
		Rating:    rating,
		Comment:   comment,
		CreatedAt: time.Now().UTC().Format(time.RFC3339),
	})
	r.ReviewsCount++
	if err := s.db.Save(&r).Error; err != nil {
		return Recipe{}, err
	}
	return r, nil
}

type CatalogCategory struct {
	ID       string            `json:"id"`
	Title    string            `json:"title"`
	Slug     string            `json:"slug,omitempty"`
	Children []CatalogCategory `json:"children,omitempty"`
}

func (s *Store) CatalogCategories() ([]CatalogCategory, error) {
	type row struct {
		ID       string
		Title    string
		Slug     string
		ParentID *string
	}
	var rows []row
	err := s.db.Raw(`
		SELECT id, title, COALESCE(slug, '') AS slug, parent_id
		FROM catalog.snapp_categories
		WHERE id <> '99999999' AND COALESCE(parent_id, '') <> '99999999'
		ORDER BY title
	`).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	byID := map[string]*CatalogCategory{}
	var parents []CatalogCategory
	for _, r := range rows {
		if r.ParentID == nil || *r.ParentID == "" {
			parents = append(parents, CatalogCategory{ID: r.ID, Title: r.Title, Slug: r.Slug})
		}
	}
	for i := range parents {
		byID[parents[i].ID] = &parents[i]
	}
	for _, r := range rows {
		if r.ParentID == nil || *r.ParentID == "" {
			continue
		}
		parent := byID[*r.ParentID]
		if parent == nil {
			continue
		}
		parent.Children = append(parent.Children, CatalogCategory{ID: r.ID, Title: r.Title, Slug: r.Slug})
	}
	out := make([]CatalogCategory, 0, len(parents))
	for _, parent := range parents {
		if len(parent.Children) == 0 {
			continue
		}
		out = append(out, parent)
	}
	return out, nil
}

func (s *Store) CatalogIngredients(categoryID string) ([]string, error) {
	var names []string
	err := s.db.Raw(`
		SELECT DISTINCT ingredient_key
		FROM catalog.products
		WHERE snapp_category_id = ?
		  AND ingredient_key IS NOT NULL
		  AND ingredient_key <> ''
		ORDER BY ingredient_key
	`, categoryID).Scan(&names).Error
	return names, err
}

func (s *Store) ListProducts() []Product {
	var out []Product
	s.db.Find(&out)
	return out
}

func (s *Store) ProductByID(id string) (Product, bool) {
	if s.snapp != nil {
		if p, ok := s.snapp.ProductByID(id); ok {
			return p, true
		}
	}
	var p Product
	err := s.db.First(&p, "id = ?", id).Error
	return p, err == nil
}

func (s *Store) FindProductFor(name string) (Product, bool) {
	if s.snapp != nil {
		if p, err := s.snapp.Match(name); err == nil && p.ID != "" {
			return p, true
		}
	}
	var products []Product
	s.db.Find(&products)
	for _, p := range products {
		for _, m := range p.Matches {
			if m == name {
				return p, true
			}
		}
	}
	for _, p := range products {
		for _, m := range p.Matches {
			if strings.Contains(m, name) || strings.Contains(name, m) {
				return p, true
			}
		}
	}
	return Product{}, false
}

func (s *Store) ListUsers() []User {
	var users []User
	s.db.Find(&users)
	out := make([]User, 0, len(users))
	for _, u := range users {
		out = append(out, s.publicUser(u))
	}
	return out
}

func (s *Store) UserByUsername(username string) (User, bool) {
	var u User
	if err := s.db.Where("username = ?", username).First(&u).Error; err != nil {
		return User{}, false
	}
	return s.publicUser(u), true
}

func (s *Store) ToggleFollow(userID, username string) (bool, error) {
	var me User
	if err := s.db.First(&me, "id = ?", userID).Error; err != nil {
		return false, fmt.Errorf("کاربر پیدا نشد")
	}
	if me.Username == username {
		return false, fmt.Errorf("نمی‌توانید خودتان را دنبال کنید")
	}
	var target User
	if err := s.db.Where("username = ?", username).First(&target).Error; err != nil {
		return false, fmt.Errorf("کاربر پیدا نشد")
	}
	var n int64
	s.db.Model(&Follow{}).Where("user_id = ? AND username = ?", userID, username).Count(&n)
	if n > 0 {
		s.db.Delete(&Follow{}, "user_id = ? AND username = ?", userID, username)
		s.syncFollowCounts(me.ID, target.Username)
		return false, nil
	}
	if err := s.db.Create(&Follow{UserID: userID, Username: username}).Error; err != nil {
		return false, err
	}
	s.syncFollowCounts(me.ID, target.Username)
	return true, nil
}

func (s *Store) Following(userID string) []string {
	var rows []Follow
	s.db.Where("user_id = ?", userID).Find(&rows)
	out := make([]string, 0, len(rows))
	for _, r := range rows {
		out = append(out, r.Username)
	}
	sort.Strings(out)
	return out
}

func (s *Store) syncFollowCounts(followerID, targetUsername string) {
	var following int64
	s.db.Model(&Follow{}).Where("user_id = ?", followerID).Count(&following)
	s.db.Model(&User{}).Where("id = ?", followerID).Update("following", following)
	var followers int64
	s.db.Model(&Follow{}).Where("username = ?", targetUsername).Count(&followers)
	s.db.Model(&User{}).Where("username = ?", targetUsername).Update("followers", followers)
}

func (s *Store) FollowingUsers(userID string) []User {
	names := s.Following(userID)
	out := make([]User, 0, len(names))
	for _, name := range names {
		if u, ok := s.UserByUsername(name); ok {
			out = append(out, u)
		}
	}
	return out
}

func (s *Store) FollowersOf(username string) []User {
	var rows []Follow
	s.db.Where("username = ?", username).Find(&rows)
	out := make([]User, 0, len(rows))
	for _, row := range rows {
		var u User
		if s.db.First(&u, "id = ?", row.UserID).Error == nil {
			out = append(out, s.publicUser(u))
		}
	}
	return out
}

func (s *Store) UpdateProfile(userID, name, bio string) (User, error) {
	name = strings.TrimSpace(name)
	bio = strings.TrimSpace(bio)
	if name == "" {
		return User{}, fmt.Errorf("نام الزامی است")
	}
	if err := s.db.Model(&User{}).Where("id = ?", userID).Updates(map[string]any{
		"name": name,
		"bio":  bio,
	}).Error; err != nil {
		return User{}, err
	}
	var u User
	if err := s.db.First(&u, "id = ?", userID).Error; err != nil {
		return User{}, err
	}
	return s.publicUser(u), nil
}

func (s *Store) SetAvatar(userID, avatar string) (User, error) {
	if err := s.db.Model(&User{}).Where("id = ?", userID).Update("avatar", avatar).Error; err != nil {
		return User{}, err
	}
	var u User
	if err := s.db.First(&u, "id = ?", userID).Error; err != nil {
		return User{}, err
	}
	return s.publicUser(u), nil
}

func (s *Store) ToggleSaved(userID, recipeID string) (bool, error) {
	r, ok := s.RecipeByID(recipeID)
	if !ok {
		return false, fmt.Errorf("دستور پخت پیدا نشد")
	}
	recipePK := r.ID
	var n int64
	s.db.Model(&SavedRecipe{}).Where("user_id = ? AND recipe_id = ?", userID, recipePK).Count(&n)
	if n > 0 {
		s.db.Delete(&SavedRecipe{}, "user_id = ? AND recipe_id = ?", userID, recipePK)
		return false, nil
	}
	if err := s.db.Create(&SavedRecipe{UserID: userID, RecipeID: recipePK}).Error; err != nil {
		return false, err
	}
	return true, nil
}

func (s *Store) SavedRecipes(userID string) []Recipe {
	var rows []SavedRecipe
	s.db.Where("user_id = ?", userID).Find(&rows)
	out := []Recipe{}
	for _, row := range rows {
		if r, ok := s.RecipeByID(row.RecipeID); ok {
			out = append(out, r)
		}
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Title < out[j].Title })
	return out
}

func (s *Store) ListPosts(tab, viewerID string) []CommunityPostView {
	var posts []CommunityPost
	q := s.db.Model(&CommunityPost{})
	switch tab {
	case "popular":
		q = q.Order("likes desc")
	default:
		q = q.Order("created_at desc")
	}
	_ = q.Find(&posts).Error
	if tab == "following" && viewerID != "" {
		names := s.Following(viewerID)
		allow := map[string]bool{}
		for _, n := range names {
			allow[n] = true
		}
		filtered := posts[:0]
		for _, p := range posts {
			var u User
			if s.db.First(&u, "id = ?", p.UserID).Error == nil && allow[u.Username] {
				filtered = append(filtered, p)
			}
		}
		posts = filtered
	}
	views := make([]CommunityPostView, 0, len(posts))
	for _, p := range posts {
		views = append(views, s.enrich(p, viewerID))
	}
	return views
}

func (s *Store) PostByID(id, viewerID string) (CommunityPostView, bool) {
	var p CommunityPost
	if err := s.db.First(&p, "id = ?", id).Error; err != nil {
		return CommunityPostView{}, false
	}
	return s.enrich(p, viewerID), true
}

func (s *Store) enrich(p CommunityPost, viewerID string) CommunityPostView {
	view := CommunityPostView{CommunityPost: p}
	if viewerID != "" {
		var n int64
		s.db.Model(&PostLike{}).Where("user_id = ? AND post_id = ?", viewerID, p.ID).Count(&n)
		view.Liked = n > 0
		if view.Liked {
			p.Likes++
			view.CommunityPost = p
		}
	}
	var u User
	if s.db.First(&u, "id = ?", p.UserID).Error == nil {
		view.User = s.publicUser(u)
	}
	if r, ok := s.RecipeByID(p.RecipeID); ok {
		view.Recipe = r
	}
	if view.Comments == nil {
		view.Comments = []Comment{}
	}
	return view
}

func (s *Store) Publish(userID, recipeID, caption, suggestion string, rating float64) (CommunityPostView, error) {
	if _, ok := s.RecipeByID(recipeID); !ok {
		return CommunityPostView{}, fmt.Errorf("دستور پخت پیدا نشد")
	}
	var u User
	if err := s.db.First(&u, "id = ?", userID).Error; err != nil {
		return CommunityPostView{}, fmt.Errorf("کاربر پیدا نشد")
	}
	p := CommunityPost{
		ID:         newID("c"),
		UserID:     userID,
		RecipeID:   recipeID,
		Rating:     rating,
		Caption:    caption,
		Suggestion: suggestion,
		CreatedAt:  time.Now().UTC().Format(time.RFC3339),
		Comments:   []Comment{},
	}
	if err := s.db.Create(&p).Error; err != nil {
		return CommunityPostView{}, err
	}
	s.db.Model(&u).Update("results_count", gorm.Expr("results_count + 1"))
	if err := s.db.First(&u, "id = ?", userID).Error; err == nil {
		if (u.Level == "" || u.Level == "cook") && u.ResultsCount >= 50 {
			s.db.Model(&u).Update("level", "chef")
		}
	}
	return s.enrich(p, userID), nil
}

func (s *Store) ToggleLike(userID, postID string) (CommunityPostView, bool, error) {
	var p CommunityPost
	if err := s.db.First(&p, "id = ?", postID).Error; err != nil {
		return CommunityPostView{}, false, fmt.Errorf("پست پیدا نشد")
	}
	var n int64
	s.db.Model(&PostLike{}).Where("user_id = ? AND post_id = ?", userID, postID).Count(&n)
	on := n == 0
	if on {
		if err := s.db.Create(&PostLike{UserID: userID, PostID: postID}).Error; err != nil {
			return CommunityPostView{}, false, err
		}
	} else {
		s.db.Delete(&PostLike{}, "user_id = ? AND post_id = ?", userID, postID)
	}
	view, _ := s.PostByID(postID, userID)
	return view, on, nil
}

func (s *Store) AddComment(userID, postID, text string) (CommunityPostView, error) {
	var u User
	if err := s.db.First(&u, "id = ?", userID).Error; err != nil {
		return CommunityPostView{}, fmt.Errorf("کاربر پیدا نشد")
	}
	var p CommunityPost
	if err := s.db.First(&p, "id = ?", postID).Error; err != nil {
		return CommunityPostView{}, fmt.Errorf("پست پیدا نشد")
	}
	p.Comments = append(p.Comments, Comment{
		ID:        newID("cm_"),
		UserID:    userID,
		UserName:  u.Name,
		Text:      text,
		CreatedAt: time.Now().UTC().Format(time.RFC3339),
	})
	if err := s.db.Model(&p).Update("comments", p.Comments).Error; err != nil {
		return CommunityPostView{}, err
	}
	return s.enrich(p, userID), nil
}

func (s *Store) Shopping(userID string) []ShoppingListItem {
	var items []ShoppingListItem
	s.db.Where("user_id = ?", userID).Order("id").Find(&items)
	return items
}

func (s *Store) ReplaceShopping(userID string, items []ShoppingListItem) []ShoppingListItem {
	_ = s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("user_id = ?", userID).Delete(&ShoppingListItem{}).Error; err != nil {
			return err
		}
		for i := range items {
			items[i].UserID = userID
			if items[i].ID == "" {
				items[i].ID = newID("si_")
			}
			if err := tx.Create(&items[i]).Error; err != nil {
				return err
			}
		}
		return nil
	})
	return s.Shopping(userID)
}

func (s *Store) AddShoppingItem(userID string, item ShoppingListItem) []ShoppingListItem {
	item.UserID = userID
	if item.ID == "" {
		item.ID = newID("si_")
	}
	s.db.Create(&item)
	return s.Shopping(userID)
}

func (s *Store) PatchShoppingItem(userID, id string, amount *float64, checked *bool) ([]ShoppingListItem, error) {
	var item ShoppingListItem
	if err := s.db.Where("id = ? AND user_id = ?", id, userID).First(&item).Error; err != nil {
		return nil, fmt.Errorf("آیتم پیدا نشد")
	}
	if amount != nil {
		item.Amount = *amount
	}
	if checked != nil {
		item.Checked = *checked
	}
	s.db.Save(&item)
	return s.Shopping(userID), nil
}

func (s *Store) RemoveShoppingItem(userID, id string) ([]ShoppingListItem, error) {
	res := s.db.Where("id = ? AND user_id = ?", id, userID).Delete(&ShoppingListItem{})
	if res.RowsAffected == 0 {
		return nil, fmt.Errorf("آیتم پیدا نشد")
	}
	return s.Shopping(userID), nil
}

func (s *Store) ClearShopping(userID string) {
	s.db.Where("user_id = ?", userID).Delete(&ShoppingListItem{})
}

func roundAmount(value float64) float64 {
	if value >= 10 {
		return math.Round(value/5) * 5
	}
	return math.Round(value*10) / 10
}

func (s *Store) AddRecipeToShopping(userID, recipeID string, servings int) ([]ShoppingListItem, error) {
	recipe, ok := s.RecipeByID(recipeID)
	if !ok {
		return nil, fmt.Errorf("دستور پخت پیدا نشد")
	}
	factor := 1.0
	if servings > 0 && recipe.Servings > 0 {
		factor = float64(servings) / float64(recipe.Servings)
	}
	items := s.Shopping(userID)
	err := s.db.Transaction(func(tx *gorm.DB) error {
		for _, ing := range recipe.Ingredients {
			amount := ing.Amount
			if ing.Unit != "به مقدار لازم" {
				amount = roundAmount(ing.Amount * factor)
			}
			product, _ := s.FindProductFor(ing.Name)
			existing := -1
			for i := range items {
				if items[i].IngredientID == ing.ID {
					existing = i
					break
				}
			}
			if existing >= 0 {
				items[existing].Amount += amount
				if err := tx.Save(&items[existing]).Error; err != nil {
					return err
				}
				continue
			}
			item := ShoppingListItem{
				ID:           recipe.ID + "-" + ing.ID,
				UserID:       userID,
				IngredientID: ing.ID,
				Name:         ing.Name,
				Amount:       amount,
				Unit:         ing.Unit,
			}
			if product.ID != "" {
				item.ProductID = product.ID
			}
			if err := tx.Create(&item).Error; err != nil {
				return err
			}
			items = append(items, item)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return s.Shopping(userID), nil
}

func (s *Store) Conversations() []Conversation {
	var out []Conversation
	s.db.Order("at desc").Find(&out)
	return out
}

func (s *Store) Conversation(id string) (Conversation, bool) {
	var c Conversation
	err := s.db.First(&c, "id = ?", id).Error
	return c, err == nil
}

func (s *Store) SendMessage(id, text string, fromMe bool) (Conversation, error) {
	var c Conversation
	if err := s.db.First(&c, "id = ?", id).Error; err != nil {
		return Conversation{}, fmt.Errorf("گفتگو پیدا نشد")
	}
	msg := ChatMessage{
		ID:     newID("msg_"),
		FromMe: fromMe,
		Text:   text,
		At:     time.Now().UTC().Format(time.RFC3339),
	}
	c.Messages = append(c.Messages, msg)
	c.Preview = text
	c.At = msg.At
	if !fromMe {
		c.Unread++
	}
	if err := s.db.Save(&c).Error; err != nil {
		return Conversation{}, err
	}
	return c, nil
}

func (s *Store) Notifications() []AppNotification {
	var out []AppNotification
	s.db.Order("at desc").Find(&out)
	return out
}

func (s *Store) MarkNotificationRead(id string) error {
	res := s.db.Model(&AppNotification{}).Where("id = ?", id).Update("unread", false)
	if res.RowsAffected == 0 {
		return fmt.Errorf("اعلان پیدا نشد")
	}
	return nil
}

func (s *Store) MarkAllNotificationsRead() {
	s.db.Model(&AppNotification{}).Where("unread = ?", true).Update("unread", false)
}

func (s *Store) AdminSummary() map[string]int64 {
	var recipes, users, posts, contacts int64
	s.db.Model(&Recipe{}).Count(&recipes)
	s.db.Model(&User{}).Count(&users)
	s.db.Model(&CommunityPost{}).Count(&posts)
	s.db.Model(&ContactMessage{}).Count(&contacts)
	return map[string]int64{
		"recipes":  recipes,
		"users":    users,
		"posts":    posts,
		"contacts": contacts,
	}
}

func (s *Store) Contacts() []ContactMessage {
	var out []ContactMessage
	s.db.Order("at desc").Find(&out)
	return out
}

func (s *Store) SetUserLevel(id, level string) (User, error) {
	if level != "cook" && level != "chef" && level != "staff" {
		return User{}, fmt.Errorf("سطح نامعتبر است")
	}
	var u User
	if err := s.db.First(&u, "id = ?", id).Error; err != nil {
		return User{}, fmt.Errorf("کاربر پیدا نشد")
	}
	if u.Level == "staff" && level != "staff" {
		var n int64
		s.db.Model(&User{}).Where("level = ?", "staff").Count(&n)
		if n <= 1 {
			return User{}, fmt.Errorf("حداقل یک حساب staff باید بماند")
		}
	}
	u.Level = level
	if err := s.db.Model(&u).Update("level", level).Error; err != nil {
		return User{}, err
	}
	return s.publicUser(u), nil
}

func (s *Store) AdminUpdateUser(id, name, bio, level string) (User, error) {
	var u User
	if err := s.db.First(&u, "id = ?", id).Error; err != nil {
		return User{}, fmt.Errorf("کاربر پیدا نشد")
	}
	name = strings.TrimSpace(name)
	if name == "" {
		return User{}, fmt.Errorf("نام الزامی است")
	}
	if err := s.db.Model(&u).Updates(map[string]any{
		"name": name,
		"bio":  strings.TrimSpace(bio),
	}).Error; err != nil {
		return User{}, err
	}
	if level != "" && level != u.Level {
		return s.SetUserLevel(id, level)
	}
	u.Name = name
	u.Bio = strings.TrimSpace(bio)
	return s.publicUser(u), nil
}

func (s *Store) UpdatePost(id, caption, suggestion string, rating float64) (CommunityPost, error) {
	var p CommunityPost
	if err := s.db.First(&p, "id = ?", id).Error; err != nil {
		return CommunityPost{}, fmt.Errorf("پست پیدا نشد")
	}
	if rating < 1 {
		rating = 1
	}
	if rating > 5 {
		rating = 5
	}
	p.Caption = strings.TrimSpace(caption)
	p.Suggestion = strings.TrimSpace(suggestion)
	p.Rating = rating
	if err := s.db.Model(&p).Updates(map[string]any{
		"caption":    p.Caption,
		"suggestion": p.Suggestion,
		"rating":     p.Rating,
	}).Error; err != nil {
		return CommunityPost{}, err
	}
	return p, nil
}

func (s *Store) DeleteRecipe(id string) error {
	res := s.db.Delete(&Recipe{}, "id = ?", id)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return fmt.Errorf("دستور پیدا نشد")
	}
	return nil
}

func (s *Store) DeletePost(id string) error {
	res := s.db.Delete(&CommunityPost{}, "id = ?", id)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return fmt.Errorf("پست پیدا نشد")
	}
	s.db.Where("post_id = ?", id).Delete(&PostLike{})
	return nil
}

func (s *Store) AddContact(name, email, message string) ContactMessage {
	c := ContactMessage{
		ID:      newID("ct_"),
		Name:    name,
		Email:   email,
		Message: message,
		At:      time.Now().UTC().Format(time.RFC3339),
	}
	s.db.Create(&c)
	return c
}

func defaultShoppingList(userID string) []ShoppingListItem {
	return []ShoppingListItem{
		{ID: "r1-r1-i1", UserID: userID, IngredientID: "r1-i1", Name: "پاستا", Amount: 400, Unit: "گرم", ProductID: "p1"},
		{ID: "r1-r1-i2", UserID: userID, IngredientID: "r1-i2", Name: "سینه مرغ", Amount: 500, Unit: "گرم", ProductID: "p2"},
		{ID: "r1-r1-i3", UserID: userID, IngredientID: "r1-i3", Name: "خامه صبحانه", Amount: 200, Unit: "گرم", ProductID: "p3"},
		{ID: "r1-r1-i4", UserID: userID, IngredientID: "r1-i4", Name: "قارچ", Amount: 200, Unit: "گرم", ProductID: "p4"},
		{ID: "r1-r1-i5", UserID: userID, IngredientID: "r1-i5", Name: "کره", Amount: 50, Unit: "گرم", ProductID: "p5"},
		{ID: "r1-r1-i6", UserID: userID, IngredientID: "r1-i6", Name: "پنیر پارمزان", Amount: 100, Unit: "گرم", ProductID: "p6"},
	}
}
