/**
 * Whether a nav link is the current page: exact for "/", section prefix otherwise.
 * When Vercel re-renders the homepage after an on-demand revalidation, the server sees the
 * path "/index"; it is read as "/" so the server and browser mark the same link (no hydration error).
 */
export function isActivePath(href: string, pathname: string): boolean {
  const path = pathname === "/index" ? "/" : pathname;
  if (href === "/") return path === "/";
  return path === href || path.startsWith(`${href}/`);
}
