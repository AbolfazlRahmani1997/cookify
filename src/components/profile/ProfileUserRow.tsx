import { Link } from "react-router-dom";
import { Avatar } from "@/components/common/Avatar";
import { formatNumber } from "@/lib/format";
import type { User } from "@/data/types";

export function ProfileUserRow({
  user,
  onPick,
}: {
  user: User;
  onPick?: () => void;
}) {
  return (
    <Link
      to={`/profile/${user.username}`}
      onClick={onPick}
      className="flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-canvas"
    >
      <Avatar name={user.name} src={user.avatar} size={44} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-ink">
          {user.name}
          {user.level === "chef" || user.level === "staff" ? " · سرآشپز" : ""}
        </span>
        <span className="block text-[11px] text-muted">@{user.username}</span>
      </span>
      <span className="text-[11px] text-muted">
        {formatNumber(user.resultsCount)} دست‌پخت
      </span>
    </Link>
  );
}
