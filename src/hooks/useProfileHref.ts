import { useAuth } from "@/context/AuthContext";

export function useProfileHref() {
  const { isLoggedIn, user } = useAuth();
  return isLoggedIn ? `/profile/${user.username}` : "/login";
}
