"use client";

import { cn } from "cn";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { isActivePath } from "@/lib/active-path";

type Props = {
  items: { href: string; label: string }[];
  /** Called after a link is clicked (the mobile menu uses it to close). */
  onNavigate?: () => void;
  variant: "desktop" | "mobile";
};

/** Main navigation links; the current page is marked with aria-current. */
export function NavLinks({ items, onNavigate, variant }: Props) {
  const pathname = usePathname();
  return (
    <ul className={variant === "desktop" ? "flex items-center gap-6 text-sm font-medium" : "flex flex-col"}>
      {items.map((item) => {
        const active = isActivePath(item.href, pathname);
        return (
          <li
            key={item.href}
            className={variant === "mobile" ? "border-b border-border last:border-0" : undefined}
          >
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                variant === "desktop"
                  ? "border-b-2 py-1 transition-colors hover:text-foreground"
                  : "block border-l-4 py-3 pl-3 font-medium",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground",
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
