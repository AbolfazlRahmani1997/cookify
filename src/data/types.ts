export type Difficulty = "آسان" | "متوسط" | "سخت";

export type RecipeCategory =
  | "غذای اصلی"
  | "پیش‌غذا"
  | "دسر"
  | "صبحانه"
  | "سالاد"
  | "نوشیدنی";

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  /** Optional grouping such as "سس" or "خمیر" */
  group?: string;
}

export interface RecipeStep {
  id: string;
  order: number;
  title?: string;
  description: string;
  minutes?: number;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Recipe {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: RecipeCategory;
  cuisine: string;
  rating: number;
  reviewsCount: number;
  timeMinutes: number;
  prepMinutes: number;
  servings: number;
  difficulty: Difficulty;
  calories: number;
  /** Public URL, e.g. `/static/food/r1.jpg` */
  image?: string;
  authorId?: string;
  authorUsername?: string;
  authorName?: string;
  tags: string[];
  ingredients: Ingredient[];
  steps: RecipeStep[];
  tips: string[];
  reviews: Review[];
}

export type ProductAvailability = "in-stock" | "low-stock" | "out-of-stock";

export interface Product {
  id: string;
  title: string;
  brand: string;
  /** price before discount, in Toman */
  price: number;
  /** discount amount in Toman (0 when none) */
  discount: number;
  unit: string;
  availability: ProductAvailability;
  category: string;
  categoryTitle?: string;
  categorySlug?: string;
  subcategoryTitle?: string;
  image?: string;
  /** Snapp product_entity, the ingredient name when the market provides it */
  productEntity?: string;
  /** ingredient names this product can satisfy */
  matches: string[];
}

export interface User {
  id: string;
  /** Numeric id used by the realtime chat service. */
  chatId?: number;
  chatJwt?: string;
  username: string;
  name: string;
  bio: string;
  followers: number;
  following: number;
  resultsCount: number;
  savedRecipeIds: string[];
  avatar?: string;
  /** cook = default, chef = can publish recipes, staff = Cookify */
  level?: "cook" | "chef" | "staff";
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  userId: string;
  recipeId: string;
  rating: number;
  caption: string;
  suggestion: string;
  likes: number;
  createdAt: string;
  comments: Comment[];
}

/** Post with its author and recipe resolved — what the feed actually renders. */
export interface CommunityPostView extends CommunityPost {
  user: User;
  recipe: Recipe;
  liked?: boolean;
}

export interface ChatMessage {
  id: string;
  fromMe: boolean;
  text: string;
  at: string;
}

export interface Conversation {
  id: string;
  username: string;
  name: string;
  preview: string;
  unread: number;
  at: string;
  messages: ChatMessage[];
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  to: string;
  at: string;
  unread: boolean;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  at: string;
}

export interface AdminSummary {
  recipes: number;
  users: number;
  posts: number;
  contacts: number;
}

export interface AuthSession {
  token: string;
  user: User;
}

export interface ShoppingListItem {
  id: string;
  ingredientId: string;
  name: string;
  amount: number;
  unit: string;
  checked: boolean;
  productId?: string;
}

export interface AssistantRequest {
  ingredients: string[];
  timeMinutes: number;
  mealType: string;
  servings: number;
}

export interface Recommendation {
  recipe: Recipe;
  matchScore: number;
  matchedIngredients: string[];
  missingIngredients: string[];
  reason: string;
}
