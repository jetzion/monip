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
      {items.map((item, index) => {
        const active = isActivePath(item.href, pathname);
        return (
          <li
            key={item.href}
            className={variant === "mobile" ? "border-b border-border last:border-0" : undefined}
            style={variant === "mobile" ? ({ "--i": index } as React.CSSProperties) : undefined}
          >
            {variant === "desktop" ? (
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative block pt-1 pb-1.5 transition-colors hover:text-foreground",
                  active ? "text-foreground" : "nav-hover-line text-muted-foreground",
                )}
              >
                {item.label}
                {active && <span aria-hidden="true" className="nav-indicator" />}
              </Link>
            ) : (
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block border-l-4 py-3 pl-3 font-medium",
                  active ? "border-primary text-foreground" : "border-transparent text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
