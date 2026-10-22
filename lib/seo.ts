import type { Metadata } from "next";

/**
 * Site-wide Open Graph defaults. Next.js replaces (not merges) `openGraph`
 * per page, so pages that set their own must spread these in.
 */
export const baseOpenGraph = {
  type: "website",
  siteName: "MONIP Group",
  locale: "en_US",
} satisfies Metadata["openGraph"];
