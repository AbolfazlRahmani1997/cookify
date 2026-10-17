import { cn } from "@/lib/cn";
import { userPhoto } from "@/lib/images";
import { avatarImage } from "@/lib/placeholder";

export function Avatar({
  name,
  size = 40,
  className,
  ring = false,
  src,
}: {
  name: string;
  size?: number;
  className?: string;
  ring?: boolean;
  src?: string;
}) {
  const primary = src || userPhoto(name);
  return (
    <img
      src={primary}
      alt={name}
      width={size}
      height={size}
      loading="lazy"
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = avatarImage(name);
      }}
      className={cn(
        "shrink-0 rounded-full object-cover",
        ring && "ring-2 ring-primary/30 ring-offset-2 ring-offset-surface",
        className,
      )}
      style={{ width: size, height: size }}
    />
  );
}
