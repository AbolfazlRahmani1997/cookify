import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/data/api";
import { useAuth } from "@/context/AuthContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface FollowContextValue {
  following: string[];
  isFollowing: (username: string) => boolean;
  toggleFollow: (username: string) => void;
}

const FollowContext = createContext<FollowContextValue | null>(null);

export function FollowProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [localFollowing, setLocalFollowing] = useLocalStorage<string[]>(
    "cookify.following",
    ["ali", "nazanin"],
  );
  const [remoteFollowing, setRemoteFollowing] = useState<string[]>([]);

  useEffect(() => {
    if (!isLoggedIn) return;
    api.following().then(setRemoteFollowing).catch(() => setRemoteFollowing([]));
  }, [isLoggedIn]);

  const following = isLoggedIn ? remoteFollowing : localFollowing;

  const isFollowing = useCallback(
    (username: string) => following.includes(username),
    [following],
  );

  const toggleFollow = useCallback(
    (username: string) => {
      if (isLoggedIn) {
        const was = remoteFollowing.includes(username);
        setRemoteFollowing((prev) =>
          was ? prev.filter((u) => u !== username) : [...prev, username],
        );
        api
          .toggleFollow(username)
          .then((res) => {
            setRemoteFollowing((prev) => {
              const has = prev.includes(username);
              if (res.following && !has) return [...prev, username];
              if (!res.following && has) return prev.filter((u) => u !== username);
              return prev;
            });
          })
          .catch(() => {
            setRemoteFollowing((prev) =>
              was ? [...prev, username] : prev.filter((u) => u !== username),
            );
          });
        return;
      }
      setLocalFollowing((prev) =>
        prev.includes(username)
          ? prev.filter((u) => u !== username)
          : [...prev, username],
      );
    },
    [isLoggedIn, remoteFollowing, setLocalFollowing],
  );

  const value = useMemo(
    () => ({ following, isFollowing, toggleFollow }),
    [following, isFollowing, toggleFollow],
  );

  return (
    <FollowContext.Provider value={value}>{children}</FollowContext.Provider>
  );
}

export function useFollow() {
  const ctx = useContext(FollowContext);
  if (!ctx) throw new Error("useFollow must be used within FollowProvider");
  return ctx;
}
