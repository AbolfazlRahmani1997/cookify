import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Award, ImagePlus, Star, UserPlus, Users } from "lucide-react";
import { CommunityPostCard } from "@/components/community/CommunityPostCard";
import { PostSkeleton } from "@/components/common/Skeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/common/Button";
import { Avatar } from "@/components/common/Avatar";
import { Tabs } from "@/components/common/Tabs";
import { FriendsIllustration } from "@/components/illustrations";
import { useCommunity } from "@/context/CommunityContext";
import { useToast } from "@/context/ToastContext";
import { useFollow } from "@/context/FollowContext";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/data/api";
import { FoodImage } from "@/components/common/FoodImage";
import { formatNumber, formatRating } from "@/lib/format";

const TABS = [
  { id: "all", label: "همه" },
  { id: "popular", label: "محبوب" },
  { id: "latest", label: "جدیدترین" },
  { id: "following", label: "دنبال‌شده‌ها" },
];

export function CommunityPage() {
  const { posts, loading, error, reload } = useCommunity();
  const { toast } = useToast();
  const { following } = useFollow();
  const [tab, setTab] = useState("all");
  const usersState = useAsync(() => api.getUsers(), []);
  const recipesState = useAsync(() => api.getPopularRecipes(4), []);

  const visiblePosts = useMemo(() => {
    const list = [...posts];
    if (tab === "popular") return list.sort((a, b) => b.likes - a.likes);
    if (tab === "latest")
      return list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    if (tab === "following")
      return list.filter((p) => following.includes(p.user.username));
    return list;
  }, [posts, tab, following]);

  const topUsers = [...(usersState.data ?? [])]
    .sort((a, b) => b.resultsCount - a.resultsCount)
    .slice(0, 5);

  const suggested = recipesState.data ?? [];

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">دست‌پخت‌های شما</h1>
          <p className="mt-2 text-sm text-muted">
            عکس بگیر، تجربه‌ات را با دیگران به اشتراک بذار.
          </p>
        </div>
        <Link to="/community/create" className="shrink-0 lg:hidden">
          <Button>
            <ImagePlus className="size-4" />
            ثبت دست‌پخت
          </Button>
        </Link>
      </header>

      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Side panel (right of feed on desktop) */}
        <aside className="order-2 space-y-4 lg:order-1">
          <div className="card p-4">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-extrabold text-ink">
              <Award className="size-4 text-accent" />
              پرطرفدار این هفته
            </h2>
            <ol className="space-y-2.5">
              {topUsers.map((user, index) => (
                <li key={user.id}>
                  <Link
                    to={`/profile/${user.username}`}
                    className="flex items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-canvas"
                  >
                    <span className="w-4 text-center text-sm font-extrabold text-primary">
                      {formatNumber(index + 1)}
                    </span>
                    <Avatar name={user.name} src={user.avatar} size={38} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-ink">
                        {user.name}
                        {user.level === "chef" || user.level === "staff" ? " · سرآشپز" : ""}
                      </span>
                      <span className="block text-[11px] text-muted">
                        {formatNumber(user.resultsCount)} دست‌پخت
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>

          <div className="card p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-ink">
              <Star className="size-4 text-accent" />
              دستورهای پیشنهادی
            </h2>
            <ul className="space-y-3">
              {suggested.map((recipe) => (
                <li key={recipe.id}>
                  <Link
                    to={`/recipes/${recipe.id}`}
                    className="flex items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-canvas"
                  >
                    <div className="size-12 shrink-0 overflow-hidden rounded-xl">
                      <FoodImage seed={recipe.id} src={recipe.image} alt={recipe.title} ratio="h-full" />
                    </div>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-bold text-ink">
                        {recipe.title}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
                        <Star className="size-3 fill-accent text-accent" />
                        {formatRating(recipe.rating)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-line bg-primary-light/50 p-4 text-center">
            <FriendsIllustration className="mx-auto h-24 w-24" />
            <h2 className="mt-1 text-sm font-extrabold text-ink">
              آشپزی لذت‌بخش‌تر با دوستان
            </h2>
            <p className="mt-1 text-[11px] leading-5 text-muted">
              دوستانت رو دعوت کن و با هم آشپزی کنید!
            </p>
            <Button
              size="sm"
              fullWidth
              className="mt-3"
              onClick={async () => {
                const text = "بیا تو Cookify با هم آشپزی کنیم: https://cookify.ir";
                try {
                  await navigator.clipboard.writeText(text);
                  toast("لینک دعوت کپی شد");
                } catch {
                  toast("لینک دعوت آماده است", "info");
                }
              }}
            >
              <UserPlus className="size-4" />
              دعوت از دوستان
            </Button>
          </div>
        </aside>

        {/* Feed */}
        <div className="order-1 space-y-4 lg:order-2">
          <Tabs items={TABS} active={tab} onChange={setTab} />

          {loading && (
            <>
              <PostSkeleton />
              <PostSkeleton />
            </>
          )}

          {!loading && error && (
            <ErrorState description={error} onRetry={reload} />
          )}

          {!loading && !error && visiblePosts.length === 0 && (
            <EmptyState
              icon={<ImagePlus className="size-7" />}
              title="هنوز دست‌پختی ثبت نشده"
              description="اولین نفری باش که تجربه آشپزی‌اش را با جامعه به اشتراک می‌گذارد."
              action={
                <Link to="/community/create">
                  <Button>ثبت دست‌پخت</Button>
                </Link>
              }
            />
          )}

          {!loading &&
            !error &&
            visiblePosts.map((post) => (
              <CommunityPostCard key={post.id} post={post} />
            ))}

          {!loading && !error && visiblePosts.length > 0 && (
            <p className="flex items-center justify-center gap-2 py-4 text-xs text-muted">
              <Users className="size-4" />
              به انتهای فید رسیدی
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
