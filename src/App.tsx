import { Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { ToastProvider } from "@/context/ToastContext";
import { CookSessionProvider } from "@/context/CookSessionContext";
import { SavedProvider } from "@/context/SavedContext";
import { ShoppingListProvider } from "@/context/ShoppingListContext";
import { CommunityProvider } from "@/context/CommunityContext";
import { AuthProvider } from "@/context/AuthContext";
import { FollowProvider } from "@/context/FollowContext";
import { MealPlanProvider } from "@/context/MealPlanContext";
import { LandingPage } from "@/pages/LandingPage";
import { TonightPage } from "@/pages/TonightPage";
import { AssistantPage } from "@/pages/AssistantPage";
import { RecipePage } from "@/pages/RecipePage";
import { ShoppingListPage } from "@/pages/ShoppingListPage";
import { CommunityPage } from "@/pages/CommunityPage";
import { CreateResultPage } from "@/pages/CreateResultPage";
import { CreateRecipePage } from "@/pages/CreateRecipePage";
import { ProfilePage } from "@/pages/ProfilePage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { CategoriesPage } from "@/pages/CategoriesPage";
import { FavoritesPage } from "@/pages/FavoritesPage";
import { MessagesPage } from "@/pages/MessagesPage";
import { AboutPage } from "@/pages/AboutPage";
import { ContactPage } from "@/pages/ContactPage";
import { AuthPage } from "@/pages/AuthPage";
import { AdminPage } from "@/pages/AdminPage";

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <CookSessionProvider>
        <SavedProvider>
          <FollowProvider>
            <MealPlanProvider>
            <ShoppingListProvider>
              <CommunityProvider>
                <Routes>
                  <Route element={<MarketingLayout />}>
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/login" element={<AuthPage mode="login" />} />
                    <Route path="/signup" element={<AuthPage mode="signup" />} />
                    <Route path="/admin" element={<AdminPage />} />
                  </Route>
                  <Route element={<AppLayout />}>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/tonight" element={<TonightPage />} />
                    <Route path="/assistant" element={<AssistantPage />} />
                    <Route path="/recipes/new" element={<CreateRecipePage />} />
                    <Route path="/recipes/:id" element={<RecipePage />} />
                    <Route path="/shopping-list" element={<ShoppingListPage />} />
                    <Route path="/community" element={<CommunityPage />} />
                    <Route path="/community/create" element={<CreateResultPage />} />
                    <Route path="/categories" element={<CategoriesPage />} />
                    <Route path="/favorites" element={<FavoritesPage />} />
                    <Route path="/messages" element={<MessagesPage />} />
                    <Route path="/profile/:username" element={<ProfilePage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Route>
                </Routes>
              </CommunityProvider>
            </ShoppingListProvider>
            </MealPlanProvider>
          </FollowProvider>
        </SavedProvider>
        </CookSessionProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
