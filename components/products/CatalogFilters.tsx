import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { catalogHref, type CatalogParams } from "@/lib/catalog-params";
import { cn } from "cn";

type CategoryOption = { id: number; title: string; slug: string; parent?: unknown };
type LinkItem = { id?: number; title: string; slug: string };

type Props = {
  params: CatalogParams;
  categories: CategoryOption[];
  /** Top-level category whose subcategories are shown, if any. */
  activeParentId?: number;
};

const parentId = (category: CategoryOption) =>
  typeof category.parent === "number" ? category.parent : undefined;

export function CatalogFilters({ params, categories, activeParentId }: Props) {
  const topLevel = categories.filter((category) => parentId(category) === undefined);
  const subcategories = categories.filter(
    (category) => activeParentId !== undefined && parentId(category) === activeParentId,
  );

  return (
    <div className="flex flex-col gap-6">
      <form action="/products" method="get" role="search" className="flex max-w-xl gap-2">
        <label htmlFor="catalog-q" className="sr-only">
          Search products
        </label>
        <Input
          id="catalog-q"
          name="q"
          type="search"
          defaultValue={params.q}
          placeholder="Name, material, or keyword"
          className="h-11"
        />
        {params.category && <input type="hidden" name="category" value={params.category} />}
        <Button type="submit" className="h-11 px-5">
          Search
        </Button>
      </form>

      <nav aria-label="Product categories" className="flex flex-col gap-3">
        <CategoryLinks
          items={[{ title: "All categories", slug: "" }, ...topLevel]}
          params={params}
          isActive={(item) => (item.id === undefined ? !params.category : item.id === activeParentId)}
        />
        {subcategories.length > 0 && (
          <div className="border-l-2 border-foreground pl-3">
            <span className="sr-only">Subcategories</span>
            <CategoryLinks
              items={subcategories}
              params={params}
              isActive={(item) => item.slug === params.category}
              small
            />
          </div>
        )}
      </nav>
    </div>
  );
}

function CategoryLinks({
  items,
  params,
  isActive,
  small,
}: {
  items: LinkItem[];
  params: CatalogParams;
  isActive: (item: LinkItem) => boolean;
  small?: boolean;
}) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => {
        const active = isActive(item);
        return (
          <li key={item.slug || "all"}>
            <Link
              href={catalogHref({ q: params.q, category: item.slug })}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex items-center border px-3 transition-colors",
                small ? "h-8 text-sm" : "h-9 text-sm font-medium",
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-foreground hover:border-foreground/40",
              )}
            >
              {item.title}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
