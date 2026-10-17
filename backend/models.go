package main

const demoPassword = "cookify123"

type Ingredient struct {
	ID     string  `json:"id"`
	Name   string  `json:"name"`
	Amount float64 `json:"amount"`
	Unit   string  `json:"unit"`
	Group  string  `json:"group,omitempty"`
}

type RecipeStep struct {
	ID          string `json:"id"`
	Order       int    `json:"order"`
	Title       string `json:"title,omitempty"`
	Description string `json:"description"`
	Minutes     *int   `json:"minutes,omitempty"`
}

type Review struct {
	ID        string `json:"id"`
	UserID    string `json:"userId"`
	UserName  string `json:"userName"`
	Rating    int    `json:"rating"`
	Comment   string `json:"comment"`
	CreatedAt string `json:"createdAt"`
}

type Recipe struct {
	ID             string       `gorm:"primaryKey;size:64" json:"id"`
	Slug           string       `gorm:"uniqueIndex;size:128" json:"slug"`
	Title          string       `json:"title"`
	Description    string       `json:"description"`
	Category       string       `gorm:"index" json:"category"`
	Cuisine        string       `gorm:"index" json:"cuisine"`
	Rating         float64      `json:"rating"`
	ReviewsCount   int          `json:"reviewsCount"`
	TimeMinutes    int          `json:"timeMinutes"`
	PrepMinutes    int          `json:"prepMinutes"`
	Servings       int          `json:"servings"`
	Difficulty     string       `json:"difficulty"`
	Calories       int          `json:"calories"`
	Image          string       `json:"image"`
	AuthorID       string       `json:"authorId,omitempty"`
	AuthorUsername string       `json:"authorUsername,omitempty"`
	AuthorName     string       `json:"authorName,omitempty"`
	Tags           []string     `gorm:"serializer:json" json:"tags"`
	Ingredients    []Ingredient `gorm:"serializer:json" json:"ingredients"`
	Steps          []RecipeStep `gorm:"serializer:json" json:"steps"`
	Tips           []string     `gorm:"serializer:json" json:"tips"`
	Reviews        []Review     `gorm:"serializer:json" json:"reviews"`
}

type Product struct {
	ID               string   `gorm:"primaryKey;size:64" json:"id"`
	Title            string   `json:"title"`
	Brand            string   `json:"brand"`
	Price            int      `json:"price"`
	Discount         int      `json:"discount"`
	Unit             string   `json:"unit"`
	Availability     string   `json:"availability"`
	Category         string   `json:"category"`
	CategoryID       int      `json:"categoryId,omitempty"`
	CategoryTitle    string   `json:"categoryTitle,omitempty"`
	CategorySlug     string   `json:"categorySlug,omitempty"`
	SubcategoryID    int      `json:"subcategoryId,omitempty"`
	SubcategoryTitle string   `json:"subcategoryTitle,omitempty"`
	SubcategorySlug  string   `json:"subcategorySlug,omitempty"`
	Image            string   `json:"image,omitempty"`
	Entity           string   `json:"productEntity,omitempty"`
	Matches          []string `gorm:"serializer:json" json:"matches"`
}

type User struct {
	ID             string   `gorm:"primaryKey;size:64" json:"id"`
	ChatID         int      `gorm:"uniqueIndex" json:"chatId"`
	ChatJWT        string   `gorm:"-" json:"chatJwt,omitempty"`
	Username       string   `gorm:"uniqueIndex;size:64" json:"username"`
	Name           string   `json:"name"`
	Bio            string   `json:"bio"`
	Followers      int      `json:"followers"`
	FollowingCount int      `gorm:"column:following" json:"following"`
	ResultsCount   int      `json:"resultsCount"`
	Email          string   `gorm:"uniqueIndex;size:128" json:"email,omitempty"`
	PasswordHash   string   `gorm:"not null" json:"-"`
	Avatar         string   `json:"avatar,omitempty"`
	Level          string   `gorm:"size:16;default:cook" json:"level"`
	SavedRecipeIDs []string `gorm:"-" json:"savedRecipeIds"`
}

func (u User) CanPublishRecipes() bool {
	return u.Level == "chef" || u.Level == "staff"
}

type Comment struct {
	ID        string `json:"id"`
	UserID    string `json:"userId"`
	UserName  string `json:"userName"`
	Text      string `json:"text"`
	CreatedAt string `json:"createdAt"`
}

type CommunityPost struct {
	ID         string    `gorm:"primaryKey;size:64" json:"id"`
	UserID     string    `gorm:"index;size:64" json:"userId"`
	RecipeID   string    `gorm:"index;size:64" json:"recipeId"`
	Rating     float64   `json:"rating"`
	Caption    string    `json:"caption"`
	Suggestion string    `json:"suggestion"`
	Likes      int       `json:"likes"`
	CreatedAt  string    `gorm:"index" json:"createdAt"`
	Comments   []Comment `gorm:"serializer:json" json:"comments"`
}

type CommunityPostView struct {
	CommunityPost
	User   User   `json:"user"`
	Recipe Recipe `json:"recipe"`
	Liked  bool   `json:"liked"`
}

type ShoppingListItem struct {
	ID           string  `gorm:"primaryKey;size:64" json:"id"`
	UserID       string  `gorm:"index;size:64" json:"-"`
	IngredientID string  `json:"ingredientId"`
	Name         string  `json:"name"`
	Amount       float64 `json:"amount"`
	Unit         string  `json:"unit"`
	Checked      bool    `json:"checked"`
	ProductID    string  `json:"productId,omitempty"`
}

type AssistantRequest struct {
	Ingredients []string `json:"ingredients"`
	TimeMinutes int      `json:"timeMinutes"`
	MealType    string   `json:"mealType"`
	Servings    int      `json:"servings"`
}

type Recommendation struct {
	Recipe             Recipe   `json:"recipe"`
	MatchScore         int      `json:"matchScore"`
	MatchedIngredients []string `json:"matchedIngredients"`
	MissingIngredients []string `json:"missingIngredients"`
	Reason             string   `json:"reason"`
}

type ChatMessage struct {
	ID     string `json:"id"`
	FromMe bool   `json:"fromMe"`
	Text   string `json:"text"`
	At     string `json:"at"`
}

type Conversation struct {
	ID       string        `gorm:"primaryKey;size:64" json:"id"`
	Username string        `json:"username"`
	Name     string        `json:"name"`
	Preview  string        `json:"preview"`
	Unread   int           `json:"unread"`
	At       string        `json:"at"`
	Messages []ChatMessage `gorm:"serializer:json" json:"messages"`
}

type AppNotification struct {
	ID     string `gorm:"primaryKey;size:64" json:"id"`
	Title  string `json:"title"`
	Body   string `json:"body"`
	To     string `json:"to"`
	At     string `json:"at"`
	Unread bool   `json:"unread"`
}

type ContactMessage struct {
	ID      string `gorm:"primaryKey;size:64" json:"id"`
	Name    string `json:"name"`
	Email   string `json:"email"`
	Message string `json:"message"`
	At      string `json:"at"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type Session struct {
	Token  string `gorm:"primaryKey;size:80"`
	UserID string `gorm:"index;size:64;not null"`
}

type PostLike struct {
	UserID string `gorm:"primaryKey;size:64"`
	PostID string `gorm:"primaryKey;size:64;index"`
}

type Follow struct {
	UserID   string `gorm:"primaryKey;size:64"`
	Username string `gorm:"primaryKey;size:64"`
}

type SavedRecipe struct {
	UserID   string `gorm:"primaryKey;size:64"`
	RecipeID string `gorm:"primaryKey;size:64"`
}
