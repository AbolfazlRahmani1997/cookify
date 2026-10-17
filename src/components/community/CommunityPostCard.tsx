import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  ImageIcon,
  Lightbulb,
  MessageCircle,
  MoreHorizontal,
  Share2,
  Star,
  UtensilsCrossed,
} from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import { FoodImage } from "@/components/common/FoodImage";
import { Modal } from "@/components/common/Modal";
import { CommentSection } from "@/components/community/CommentSection";
import { useCommunity } from "@/context/CommunityContext";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/cn";
import { formatNumber, formatRating, relativeTime } from "@/lib/format";
import type { CommunityPostView } from "@/data/types";

export function CommunityPostCard({ post }: { post: CommunityPostView }) {
  const { toggleLike, isLiked, addComment } = useCommunity();
  const { toast } = useToast();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const liked = isLiked(post.id);

  const hashtags = [
    `#${post.recipe.category.replace(/\s/g, "_")}`,
    "#دست‌پخت_من",
    `#${post.recipe.cuisine}`,
  ];

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.recipe.title,
          url: window.location.href,
        });
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      toast("لینک پست کپی شد");
    } catch {
      toast("اشتراک‌گذاری انجام نشد", "error");
    }
  };

  return (
    <article className="card p-4 hover:shadow-pop">
      <div className="grid gap-4 sm:grid-cols-[minmax(220px,42%)_minmax(0,1fr)]">
        <div className="relative overflow-hidden rounded-2xl">
          <Link
            to={`/recipes/${post.recipe.id}`}
            className="block"
            aria-label={`دست‌پخت ${post.recipe.title}`}
          >
            <FoodImage
              seed={post.recipe.id}
              src={post.recipe.image}
              alt={`دست‌پخت ${post.recipe.title} توسط ${post.user.name}`}
              ratio="aspect-[4/3] sm:h-full"
            />
          </Link>
          <Link
            to={`/profile/${post.user.username}`}
            className="absolute right-2 top-2"
            aria-label={post.user.name}
          >
            <Avatar name={post.user.name} src={post.user.avatar} size={40} className="ring-2 ring-white" />
          </Link>
          <span className="pointer-events-none absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-lg bg-ink/70 px-2 py-1 text-[10px] font-bold text-white backdrop-blur">
            <ImageIcon className="size-3" />
            ۱/۱
          </span>
        </div>

        <div className="flex min-w-0 flex-col">
          <header className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <Link
                to={`/profile/${post.user.username}`}
                className="truncate text-sm font-bold text-ink hover:text-primary-dark"
              >
                {post.user.name}
              </Link>
              <Link
                to={`/recipes/${post.recipe.id}`}
                className="mt-0.5 block truncate text-base font-extrabold text-ink hover:text-primary-dark"
              >
                {post.recipe.title}
              </Link>
              <p className="mt-1 flex items-center gap-1.5 text-xs">
                <span className="flex items-center gap-0.5" aria-hidden>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "size-3.5",
                        i < Math.round(post.rating)
                          ? "fill-accent text-accent"
                          : "fill-line text-line",
                      )}
                    />
                  ))}
                </span>
                <span className="font-bold text-ink">
                  {formatRating(post.rating)}
                </span>
                <span className="text-muted">• {relativeTime(post.createdAt)}</span>
              </p>
            </div>
            <div className="relative">
              <button
                type="button"
                aria-label="گزینه‌های بیشتر"
                onClick={() => setMenuOpen((v) => !v)}
                className="rounded-lg p-1.5 text-muted transition-colors hover:bg-canvas"
              >
                <MoreHorizontal className="size-5" />
              </button>
              {menuOpen && (
                <div className="absolute left-0 top-9 z-10 w-36 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-pop">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      toast("گزارش ثبت شد", "info");
                    }}
                    className="block w-full px-3 py-2 text-right text-xs text-muted hover:bg-canvas"
                  >
                    گزارش پست
                  </button>
                  <Link
                    to={`/recipes/${post.recipe.id}`}
                    className="block px-3 py-2 text-xs text-muted hover:bg-canvas"
                  >
                    مشاهده دستور پخت
                  </Link>
                </div>
              )}
            </div>
          </header>

          <p className="mt-3 text-sm leading-7 text-ink">{post.caption}</p>

          {post.suggestion && (
            <div className="mt-3 flex items-start gap-2.5 rounded-2xl bg-amber-50 p-3">
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-accent" />
              <p className="text-xs leading-6 text-ink/90">
                <span className="font-bold">پیشنهاد من: </span>
                {post.suggestion}
              </p>
            </div>
          )}

          <ul className="mt-3 flex flex-wrap gap-1.5">
            {hashtags.map((tag) => (
              <li
                key={tag}
                className="rounded-lg bg-canvas px-2 py-1 text-[11px] text-muted"
              >
                {tag}
              </li>
            ))}
          </ul>

          <footer className="mt-auto flex flex-wrap items-center gap-2 border-t border-line pt-3">
            <button
              type="button"
              onClick={() => toggleLike(post.id)}
              aria-pressed={liked}
              aria-label={liked ? "برداشتن لایک" : "لایک"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-bold transition-colors",
                liked
                  ? "bg-red-50 text-danger"
                  : "text-muted hover:bg-canvas hover:text-danger",
              )}
            >
              <Heart className={cn("size-4", liked && "fill-current")} />
              {formatNumber(post.likes)}
            </button>

            <button
              type="button"
              onClick={() => setCommentsOpen(true)}
              aria-label="نظرات"
              className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-bold text-muted transition-colors hover:bg-canvas hover:text-ink"
            >
              <MessageCircle className="size-4" />
              {formatNumber(post.comments?.length ?? 0)}
            </button>

            <button
              type="button"
              onClick={share}
              className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-bold text-primary-dark transition-colors hover:bg-primary-light"
            >
              <Share2 className="size-4" />
              اشتراک‌گذاری
            </button>

            <Link
              to={`/recipes/${post.recipe.id}`}
              className="ms-auto inline-flex items-center gap-1.5 rounded-xl bg-primary-light px-3 py-2 text-xs font-bold text-primary-dark transition-colors hover:bg-primary hover:text-white"
            >
              <UtensilsCrossed className="size-4" />
              مشاهده دستور پخت
            </Link>
          </footer>
        </div>
      </div>

      <Modal
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        title={`نظرات ${post.user.name}`}
        footer={
          <CommentSection
            comments={post.comments ?? []}
            onSubmit={(text) => {
              addComment(post.id, text);
              toast("نظر شما ثبت شد");
            }}
            variant="composer"
          />
        }
      >
        <CommentSection comments={post.comments ?? []} />
      </Modal>
    </article>
  );
}
