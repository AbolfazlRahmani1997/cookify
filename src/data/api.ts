import { request, requestForm, ApiError } from "@/data/client";
import type {
  AdminSummary,
  AppNotification,
  ContactMessage,
  AssistantRequest,
  AuthSession,
  CommunityPostView,
  Conversation,
  Product,
  Recipe,
  Recommendation,
  ShoppingListItem,
  User,
} from "@/data/types";

let productCache: Product[] = [];

export function setProductCache(products: Product[] | undefined | null) {
  productCache = Array.isArray(products) ? products : [];
}

export function mergeProductCache(products: Product[] | undefined | null) {
  if (!Array.isArray(products)) return;
  const byId = new Map(productCache.map((p) => [p.id, p]));
  for (const p of products) byId.set(p.id, p);
  productCache = [...byId.values()];
}

export const api = {
  listRecipes(params?: {
    q?: string;
    category?: string;
    tag?: string;
    cuisine?: string;
    limit?: number;
  }): Promise<Recipe[]> {
    const q = new URLSearchParams();
    if (params?.q) q.set("q", params.q);
    if (params?.category) q.set("category", params.category);
    if (params?.tag) q.set("tag", params.tag);
    if (params?.cuisine) q.set("cuisine", params.cuisine);
    if (params?.limit) q.set("limit", String(params.limit));
    const qs = q.toString();
    return request(`/api/recipes${qs ? `?${qs}` : ""}`);
  },

  getPopularRecipes(limit = 5): Promise<Recipe[]> {
    return request(`/api/recipes/popular?limit=${limit}`);
  },

  async getRecipe(id: string): Promise<Recipe | undefined> {
    try {
      return await request<Recipe>(`/api/recipes/${encodeURIComponent(id)}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return undefined;
      throw err;
    }
  },

  createRecipe(body: {
    title: string;
    description: string;
    category: string;
    cuisine: string;
    difficulty: string;
    timeMinutes: number;
    prepMinutes: number;
    servings: number;
    calories: number;
    tags: string[];
    ingredients: { name: string; amount: number; unit: string; group?: string }[];
    steps: { description: string; title?: string; minutes?: number }[];
    tips: string[];
  }): Promise<Recipe> {
    return request("/api/recipes", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  uploadRecipeImage(id: string, file: File): Promise<Recipe> {
    const body = new FormData();
    body.append("image", file);
    return requestForm(`/api/recipes/${encodeURIComponent(id)}/image`, body);
  },

  catalogIngredients(categoryId: string): Promise<string[]> {
    return request(`/api/catalog/categories/${encodeURIComponent(categoryId)}/ingredients`);
  },

  catalogCategories(): Promise<
    { id: string; title: string; slug?: string; children?: { id: string; title: string; slug?: string }[] }[]
  > {
    return request("/api/catalog/categories");
  },

  async listProducts(q?: string): Promise<Product[]> {
    const qs = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
    const products = (await request<Product[]>(`/api/products${qs}`)) ?? [];
    const list = Array.isArray(products) ? products : [];
    if (!q) setProductCache(list);
    else mergeProductCache(list);
    return list;
  },

  async matchProducts(names: string[]): Promise<Product[]> {
    const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
    if (unique.length === 0) return [];
    const products = (await request<Product[]>("/api/products/match", {
      method: "POST",
      body: JSON.stringify({ names: unique }),
    })) ?? [];
    const list = Array.isArray(products) ? products : [];
    mergeProductCache(list);
    return list;
  },

  recordChoice(ingredient: string, productId: string): Promise<void> {
    return request("/api/products/choice", {
      method: "POST",
      body: JSON.stringify({ ingredient, productId }),
    });
  },

  listCommunityPosts(tab?: string): Promise<CommunityPostView[]> {
    const qs = tab ? `?tab=${encodeURIComponent(tab)}` : "";
    return request(`/api/community/posts${qs}`);
  },

  async getPost(id: string): Promise<CommunityPostView | undefined> {
    try {
      return await request(`/api/community/posts/${encodeURIComponent(id)}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return undefined;
      throw err;
    }
  },

  publishPost(input: {
    recipeId: string;
    caption: string;
    suggestion: string;
    rating: number;
  }): Promise<CommunityPostView> {
    return request("/api/community/posts", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  toggleLike(id: string): Promise<{ liked: boolean; post: CommunityPostView }> {
    return request(`/api/community/posts/${encodeURIComponent(id)}/like`, {
      method: "POST",
    });
  },

  addComment(id: string, text: string): Promise<CommunityPostView> {
    return request(`/api/community/posts/${encodeURIComponent(id)}/comments`, {
      method: "POST",
      body: JSON.stringify({ text }),
    });
  },

  async getUser(username: string) {
    try {
      return await request<User>(`/api/users/${encodeURIComponent(username)}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return undefined;
      throw err;
    }
  },

  getUsers(): Promise<User[]> {
    return request("/api/users");
  },

  listFollowingUsers(username: string): Promise<User[]> {
    return request(`/api/users/${encodeURIComponent(username)}/following`);
  },

  listFollowers(username: string): Promise<User[]> {
    return request(`/api/users/${encodeURIComponent(username)}/followers`);
  },

  updateProfile(name: string, bio: string): Promise<User> {
    return request("/api/auth/me", {
      method: "PATCH",
      body: JSON.stringify({ name, bio }),
    });
  },

  uploadAvatar(file: File): Promise<User> {
    const body = new FormData();
    body.append("avatar", file);
    return requestForm("/api/auth/me/avatar", body);
  },

  toggleFollow(username: string): Promise<{ following: boolean }> {
    return request(`/api/users/${encodeURIComponent(username)}/follow`, {
      method: "POST",
    });
  },

  following(): Promise<string[]> {
    return request("/api/me/following");
  },

  getSavedRecipes(): Promise<Recipe[]> {
    return request("/api/me/saved-recipes");
  },

  toggleSaved(recipeId: string): Promise<{ saved: boolean }> {
    return request(`/api/recipes/${encodeURIComponent(recipeId)}/save`, {
      method: "POST",
    });
  },

  login(email: string, password: string): Promise<AuthSession> {
    return request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  register(name: string, email: string, password: string): Promise<AuthSession> {
    return request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
  },

  me(): Promise<User> {
    return request("/api/auth/me");
  },

  logout(): Promise<{ ok: boolean }> {
    return request("/api/auth/logout", { method: "POST" });
  },

  buildShoppingList(recipeId: string, servings?: number): Promise<ShoppingListItem[]> {
    return request("/api/shopping-list/from-recipe", {
      method: "POST",
      body: JSON.stringify({ recipeId, servings }),
    });
  },

  recommend(body: AssistantRequest): Promise<Recommendation[]> {
    return request("/api/assistant/recommend", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  listUsers(): Promise<User[]> {
    return request("/api/users");
  },

  listConversations(): Promise<Conversation[]> {
    return request("/api/messages");
  },

  sendMessage(id: string, text: string): Promise<Conversation> {
    return request(`/api/messages/${encodeURIComponent(id)}`, {
      method: "POST",
      body: JSON.stringify({ text, fromMe: true }),
    });
  },

  listNotifications(): Promise<AppNotification[]> {
    return request("/api/notifications");
  },

  markNotificationRead(id: string): Promise<AppNotification[]> {
    return request(`/api/notifications/${encodeURIComponent(id)}/read`, {
      method: "POST",
    });
  },

  markAllNotificationsRead(): Promise<AppNotification[]> {
    return request("/api/notifications/read-all", { method: "POST" });
  },

  adminSummary(): Promise<AdminSummary> {
    return request("/api/admin/summary");
  },

  adminContacts(): Promise<ContactMessage[]> {
    return request("/api/admin/contacts");
  },

  adminUpdateUser(
    id: string,
    body: { name: string; bio: string; level: "cook" | "chef" | "staff" },
  ): Promise<User> {
    return request(`/api/admin/users/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  adminCreateRecipe(body: Partial<Recipe>): Promise<Recipe> {
    return request("/api/admin/recipes", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  adminUpdateRecipe(id: string, body: Partial<Recipe>): Promise<Recipe> {
    return request(`/api/admin/recipes/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  adminUpdatePost(
    id: string,
    body: { caption: string; suggestion: string; rating: number },
  ): Promise<CommunityPostView> {
    return request(`/api/admin/posts/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  adminDeleteRecipe(id: string): Promise<unknown> {
    return request(`/api/admin/recipes/${encodeURIComponent(id)}`, { method: "DELETE" });
  },

  adminDeletePost(id: string): Promise<unknown> {
    return request(`/api/admin/posts/${encodeURIComponent(id)}`, { method: "DELETE" });
  },

  contact(name: string, email: string, message: string): Promise<unknown> {
    return request("/api/contact", {
      method: "POST",
      body: JSON.stringify({ name, email, message }),
    });
  },

  startCookSession(body: {
    topic: string;
    recipeId: string;
    recipeTitle: string;
    stepId: string;
    label: string;
    reminder: string;
    totalMinutes: number;
    everyMinutes: number;
  }): Promise<{
    id: string;
    topic: string;
    recipeId: string;
    recipeTitle: string;
    stepId: string;
    label: string;
    reminder: string;
    totalMinutes: number;
    everyMinutes: number;
    startedAt: string;
    nextNudgeAt: string;
    endsAt: string;
    finished: boolean;
    subscribeUrl: string;
  }> {
    return request("/api/cook-sessions", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  stopCookSession(id: string): Promise<unknown> {
    return request(`/api/cook-sessions/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
};

export function findProductFor(ingredientName: string): Product | undefined {
  const exact = productCache.find((p) =>
    p.matches.some((m) => m === ingredientName),
  );
  if (exact) return exact;
  const fuzzy = productCache.find((p) =>
    p.matches.some(
      (m) => m.includes(ingredientName) || ingredientName.includes(m),
    ),
  );
  if (fuzzy) return fuzzy;
  return productCache.find(
    (p) =>
      p.title.includes(ingredientName) || ingredientName.includes(p.title),
  );
}

export function productById(id: string): Product | undefined {
  return productCache.find((p) => p.id === id);
}
