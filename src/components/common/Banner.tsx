import { cn } from "@/lib/cn";

export function Banner({
  src,
  alt,
  className,
  imgClassName,
  ratio = "aspect-[8/3]",
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  /** Tailwind aspect class, or "auto" to keep the image's natural ratio. */
  ratio?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-3xl", className)}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={cn(
          "w-full",
          ratio === "auto" ? "h-auto" : cn("object-cover", ratio),
          imgClassName,
        )}
      />
    </div>
  );
}
