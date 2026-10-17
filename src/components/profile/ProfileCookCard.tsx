import { Heart, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { FoodImage } from "@/components/common/FoodImage";
import { formatNumber, formatRating } from "@/lib/format";
import type { CommunityPostView } from "@/data/types";

export function ProfileCookCard({ post }: { post: CommunityPostView }) {
  return (
    <article className="overflow-hidden rounded-xl border border-line bg-surface transition-shadow hover:shadow-soft">
      <Link
        to={`/recipes/${post.recipe.id}`}
        className="relative block"
        aria-label={post.recipe.title}
      >
        <FoodImage
          seed={post.recipe.id}
          src={post.recipe.image}
          alt={post.recipe.title}
          ratio="aspect-square"
        />
        <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-0.5 rounded-full bg-white/95 px-1.5 py-0.5 text-[10px] font-bold text-ink">
          <Heart className="size-2.5 fill-danger text-danger" />
          {formatNumber(post.likes)}
        </span>
        <span className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-0.5 rounded-full bg-white/95 px-1.5 py-0.5 text-[10px] font-bold text-ink">
          <Star className="size-2.5 fill-accent text-accent" />
          {formatRating(post.rating)}
        </span>
      </Link>
      <div className="px-2 py-1.5">
        <p className="line-clamp-1 text-[11px] font-extrabold text-ink">
          {post.recipe.title}
        </p>
      </div>
    </article>
  );
}
