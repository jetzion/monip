import type { Metadata } from "next";
import { notFound } from "next/navigation";

import type { PageKey } from "@/collections/Pages";
import { contentAccess } from "@/lib/queries/access";
import { getPage } from "@/lib/queries/content";
import { populated } from "@/lib/payload";
import { baseOpenGraph } from "@/lib/seo";
import type { Media } from "@/payload-types";

const PATHS: Record<PageKey, string> = {
  about: "/about",
  products: "/products",
  clients: "/clients",
  "success-stories": "/success-stories",
  privacy: "/privacy",
};

/** Metadata for a CMS text page; empty if the page is not published. */
export async function contentPageMetadata(key: PageKey): Promise<Metadata> {
  const page = await getPage(key, await contentAccess());
  if (!page) return {};
  const title = page.seo?.title || page.title;
  const description = page.seo?.description || page.intro || undefined;
  const image = populated<Media>(page.image);
  return {
    title,
    description,
    alternates: { canonical: PATHS[key] },
    openGraph: {
      ...baseOpenGraph,
      title,
      description,
      url: PATHS[key],
      images: image?.url ? [{ url: image.url, alt: image.alt }] : undefined,
    },
  };
}

/** Loads a published CMS text page or renders the 404 page. */
export async function requirePage(key: PageKey) {
  const page = await getPage(key, await contentAccess());
  if (!page) notFound();
  return page;
}
