import { useState } from "react";
import { Send } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import { Button } from "@/components/common/Button";
import { relativeTime } from "@/lib/format";
import type { Comment } from "@/data/types";

export function CommentSection({
  comments,
  onSubmit,
  variant = "list",
}: {
  comments: Comment[];
  onSubmit?: (text: string) => void;
  variant?: "list" | "composer";
}) {
  const [text, setText] = useState("");

  if (variant === "composer") {
    return (
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const value = text.trim();
          if (!value) return;
          onSubmit?.(value);
          setText("");
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="نظر خود را بنویسید…"
          aria-label="نظر جدید"
          className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-canvas px-4 text-sm placeholder:text-muted/70 focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <Button type="submit" size="sm" disabled={!text.trim()}>
          <Send className="size-4" />
          ارسال
        </Button>
      </form>
    );
  }

  if (comments.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted">
        هنوز نظری ثبت نشده است. اولین نفر باشید!
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {comments.map((comment) => (
        <li key={comment.id} className="flex gap-3">
          <Avatar name={comment.userName} size={36} />
          <div className="min-w-0 flex-1 rounded-2xl bg-canvas px-3.5 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-ink">{comment.userName}</p>
              <span className="text-[11px] text-muted">
                {relativeTime(comment.createdAt)}
              </span>
            </div>
            <p className="mt-1 text-sm leading-6 text-muted">{comment.text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
