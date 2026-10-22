/** Public site origin, e.g. https://www.monip.com. Required in production. */
export function siteUrl(): string {
  const url = process.env.SITE_URL;
  if (url) return url.replace(/\/$/, "");
  if (process.env.NODE_ENV === "production") throw new Error("SITE_URL is not set.");
  return "http://localhost:3000";
}

/** True only on the production deployment; previews and local dev are not indexed. */
export const isIndexable = () =>
  process.env.VERCEL_ENV ? process.env.VERCEL_ENV === "production" : true;
