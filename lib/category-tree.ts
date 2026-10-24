type TreeInput = { id: number; parent?: unknown };

export type CategoryNode<T> = T & { children: T[] };

const parentId = (category: TreeInput) =>
  typeof category.parent === "number"
    ? category.parent
    : typeof category.parent === "object" && category.parent !== null && "id" in category.parent
      ? (category.parent.id as number)
      : undefined;

/** Groups subcategories under their parent, keeping the input order. Orphans become top-level. */
export function buildCategoryTree<T extends TreeInput>(categories: T[]): CategoryNode<T>[] {
  const ids = new Set(categories.map((category) => category.id));
  const isTopLevel = (category: T) => {
    const parent = parentId(category);
    return parent === undefined || !ids.has(parent);
  };
  return categories.filter(isTopLevel).map((top) => ({
    ...top,
    children: categories.filter((category) => !isTopLevel(category) && parentId(category) === top.id),
  }));
}
