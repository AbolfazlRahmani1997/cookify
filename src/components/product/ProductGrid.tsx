import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/data/types";

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 snap-x snap-mandatory scrollbar-thin">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
