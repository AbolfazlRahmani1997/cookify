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
import type { CommunityPostView } from "@/data/types";
import { useAuth } from "@/context/AuthContext";

export interface PublishInput {
  recipeId: string;
  caption: string;
  suggestion: string;
  rating: number;
}

interface CommunityContextValue {
  posts: CommunityPostView[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  toggleLike: (id: string) => void;
  isLiked: (id: string) => boolean;
  addComment: (postId: string, text: string) => void;
  publish: (input: PublishInput) => Promise<void>;
}

const CommunityContext = createContext<CommunityContextValue | null>(null);

export function CommunityProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [posts, setPosts] = useState<CommunityPostView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const [likedIds, setLikedIds] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api
      .listCommunityPosts()
      .then((data) => {
        if (!active) return;
        setPosts(data);
        setLikedIds(data.filter((p) => p.liked).map((p) => p.id));
      })
      .catch((err: unknown) => {
        if (active)
          setError(err instanceof Error ? err.message : "خطای ناشناخته");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [nonce, isLoggedIn]);

  const upsert = useCallback((post: CommunityPostView) => {
    setPosts((prev) => {
      const rest = prev.filter((p) => p.id !== post.id);
      return [post, ...rest].sort(
        (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
      );
    });
  }, []);

  const toggleLike = useCallback(
    (id: string) => {
      if (!isLoggedIn) return;
      const was = likedIds.includes(id);
      setLikedIds((prev) =>
        was ? prev.filter((x) => x !== id) : [...prev, id],
      );
      setPosts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, likes: p.likes + (was ? -1 : 1) } : p,
        ),
      );
      api
        .toggleLike(id)
        .then(({ liked, post }) => {
          upsert(post);
          setLikedIds((prev) => {
            const has = prev.includes(id);
            if (liked && !has) return [...prev, id];
            if (!liked && has) return prev.filter((x) => x !== id);
            return prev;
          });
        })
        .catch(() => {
          setLikedIds((prev) =>
            was ? [...prev, id] : prev.filter((x) => x !== id),
          );
          setPosts((prev) =>
            prev.map((p) =>
              p.id === id ? { ...p, likes: p.likes + (was ? 1 : -1) } : p,
            ),
          );
        });
    },
    [isLoggedIn, likedIds, upsert],
  );

  const isLiked = useCallback((id: string) => likedIds.includes(id), [likedIds]);

  const addComment = useCallback(
    (postId: string, text: string) => {
      if (!isLoggedIn) return;
      api.addComment(postId, text).then(upsert).catch(() => undefined);
    },
    [isLoggedIn, upsert],
  );

  const publish = useCallback(
    async (input: PublishInput) => {
      const post = await api.publishPost(input);
      upsert(post);
    },
    [upsert],
  );

  const value = useMemo<CommunityContextValue>(
    () => ({
      posts,
      loading,
      error,
      reload: () => setNonce((n) => n + 1),
      toggleLike,
      isLiked,
      addComment,
      publish,
    }),
    [posts, loading, error, toggleLike, isLiked, addComment, publish],
  );

  return (
    <CommunityContext.Provider value={value}>
      {children}
    </CommunityContext.Provider>
  );
}

export function useCommunity() {
  const ctx = useContext(CommunityContext);
  if (!ctx)
    throw new Error("useCommunity must be used within CommunityProvider");
  return ctx;
}
