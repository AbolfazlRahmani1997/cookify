import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { recipePhoto } from "@/lib/images";
import { foodImage } from "@/lib/placeholder";

export function FoodImage({
  seed,
  alt,
  className,
  ratio = "aspect-[4/3]",
  src,
}: {
  seed: string;
  alt: string;
  className?: string;
  ratio?: string;
  src?: string;
}) {
  const primary = src || recipePhoto(seed);
  const [current, setCurrent] = useState(primary);

  useEffect(() => {
    setCurrent(primary);
  }, [primary]);

  return (
    <img
      src={current}
      alt={alt}
      loading="lazy"
      onError={() => {
        if (current.includes("/static/food/")) {
          setCurrent(current.replace("/static/food/", "/food/"));
          return;
        }
        setCurrent(foodImage(seed));
      }}
      className={cn("h-full w-full object-cover", ratio, className)}
    />
  );
}
