import type { ListViewClientProps, ListViewServerProps } from "payload";
import { serverProps } from "payload/shared";
import { DefaultListView } from "@payloadcms/ui";

import { buildCategoryTree } from "@/lib/category-tree";

/**
 * Categories list in the admin: top-level categories with their
 * subcategories underneath, each parent expandable and collapsible.
 * While searching or filtering, the standard table is shown instead.
 */
export async function CategoryListView(props: ListViewServerProps) {
  const { payload, searchParams, collectionConfig, user } = props;
  const clientProps = pickClientProps(props);
  if (searchParams?.search || searchParams?.where) return <DefaultListView {...clientProps} />;

  const { docs } = await payload.find({
    collection: "categories",
    depth: 0,
    limit: 0,
    pagination: false,
    sort: ["sortOrder", "title"],
    select: { title: true, parent: true, sortOrder: true },
    overrideAccess: false,
    user,
  });
  const editURL = (id: number) => `${payload.config.routes.admin}/collections/${collectionConfig.slug}/${id}`;
  const tree = buildCategoryTree(docs);

  const Table =
    tree.length === 0 ? null : (
      <ul className="category-tree">
        {tree.map((parent) => (
          <li key={parent.id}>
            {parent.children.length === 0 ? (
              <div className="category-tree__row">
                <a href={editURL(parent.id)}>{parent.title}</a>
              </div>
            ) : (
              <details open className="category-tree__group">
                <summary className="category-tree__row">
                  <a href={editURL(parent.id)}>{parent.title}</a>
                  <span className="category-tree__meta">
                    {parent.children.length} {parent.children.length === 1 ? "subcategory" : "subcategories"}
                  </span>
                </summary>
                <ul>
                  {parent.children.map((child) => (
                    <li key={child.id}>
                      <a href={editURL(child.id)}>{child.title}</a>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </li>
        ))}
      </ul>
    );

  return <DefaultListView {...clientProps} Table={Table} />;
}

/** Server-only props that cannot be passed to the client list view. */
const serverOnly = new Set<string>([...serverProps, "collectionConfig", "data", "limit", "listSearchableFields"]);

function pickClientProps(props: ListViewServerProps) {
  return Object.fromEntries(
    Object.entries(props).filter(([key]) => !serverOnly.has(key)),
  ) as ListViewClientProps;
}
