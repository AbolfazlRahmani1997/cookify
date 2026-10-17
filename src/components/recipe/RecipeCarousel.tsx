import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { IconButton } from "@/components/common/IconButton";
import type { Recipe } from "@/data/types";

export function RecipeCarousel({ recipes }: { recipes: Recipe[] }) {
  const scroller = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div
        ref={scroller}
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1"
      >
        {recipes.map((recipe) => (
          <div
            key={recipe.id}
            className="w-[168px] shrink-0 snap-start sm:w-[200px] lg:w-[224px]"
          >
            <RecipeCard recipe={recipe} />
          </div>
        ))}
      </div>

      <div className="mt-3 flex justify-center gap-2">
        <IconButton
          label="قبلی"
          variant="outline"
          size="sm"
          onClick={() => scrollBy(-1)}
        >
          <ChevronRight className="size-4" />
        </IconButton>
        <IconButton
          label="بعدی"
          variant="outline"
          size="sm"
          onClick={() => scrollBy(1)}
        >
          <ChevronLeft className="size-4" />
        </IconButton>
      </div>
    </div>
  );
}
