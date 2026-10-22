import type { Metadata } from "next";
import { notFound } from "next/navigation";

import type { PageKey } from "@/collections/Pages";
import { getPage } from "@/lib/queries/content";

const PATHS: Record<PageKey, string> = {
  about: "/about",
  sustainability: "/sustainability",
  privacy: "/privacy",
};

/** Metadata for a CMS text page; empty if the page is not published. */
export async function contentPageMetadata(key: PageKey): Promise<Metadata> {
  const page = await getPage(key);
  if (!page) return {};
  return {
    title: page.seo?.title || page.title,
    description: page.seo?.description || page.intro || undefined,
    alternates: { canonical: PATHS[key] },
  };
}

/** Loads a published CMS text page or renders the 404 page. */
export async function requirePage(key: PageKey) {
  const page = await getPage(key);
  if (!page) notFound();
  return page;
}
