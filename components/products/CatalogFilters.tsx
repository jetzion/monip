import { cn } from "cn";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pillClassName, tagItemClassName } from "@/components/ui/pill";
import { catalogHref, type CatalogParams } from "@/lib/catalog-params";

import { TagScroller } from "@/components/ui/tag-scroller";

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
    <nav aria-label="Product categories" className="flex flex-col gap-3">
      <CategoryLinks
        items={[{ title: "All categories", slug: "" }, ...topLevel]}
        params={params}
        isActive={(item) => (item.id === undefined ? !params.category : item.id === activeParentId)}
        label="categories"
      />
      {subcategories.length > 0 && (
        <CategoryLinks
          items={subcategories}
          params={params}
          isActive={(item) => item.slug === params.category}
          label="subcategories"
        />
      )}
    </nav>
  );
}

/** Keyword search; keeps the selected category. */
export function CatalogSearch({ params }: { params: CatalogParams }) {
  return (
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
        className="h-11 bg-white"
      />
      {params.category && <input type="hidden" name="category" value={params.category} />}
      <Button type="submit" className="h-11 px-5">
        Search
      </Button>
    </form>
  );
}

function CategoryLinks({
  items,
  params,
  isActive,
  label,
}: {
  items: LinkItem[];
  params: CatalogParams;
  isActive: (item: LinkItem) => boolean;
  label: string;
}) {
  return (
    <TagScroller count={items.length} label={label}>
      {items.map((item) => {
        const active = isActive(item);
        return (
          <li key={item.slug || "all"} className={tagItemClassName}>
            <Link
              href={catalogHref({ q: params.q, category: item.slug })}
              aria-current={active ? "page" : undefined}
              title={item.title}
              className={cn(pillClassName({ active, dark: true, compact: true }), "w-full justify-center")}
            >
              <span className="truncate">{item.title}</span>
            </Link>
          </li>
        );
      })}
    </TagScroller>
  );
}
