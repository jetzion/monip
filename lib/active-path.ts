/** Whether a nav link is the current page: exact for "/", section prefix otherwise. */
export function isActivePath(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
