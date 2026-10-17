import { Avatar } from "@/components/common/Avatar";
import { Rating } from "@/components/common/Rating";
import { relativeTime } from "@/lib/format";
import type { Review } from "@/data/types";

export function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">
        هنوز نظری ثبت نشده است. اولین نفر باشید!
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {reviews.map((review) => (
        <li key={review.id} className="rounded-2xl border border-line bg-surface p-4">
          <div className="flex items-center gap-3">
            <Avatar name={review.userName} size={40} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-ink">{review.userName}</p>
              <p className="text-xs text-muted">{relativeTime(review.createdAt)}</p>
            </div>
            <Rating value={review.rating} />
          </div>
          <p className="mt-3 text-sm leading-7 text-muted">{review.comment}</p>
        </li>
      ))}
    </ul>
  );
}
