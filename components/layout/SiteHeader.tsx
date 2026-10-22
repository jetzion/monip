import Link from "next/link";

import { mainNav } from "@/lib/navigation";

import { Wordmark } from "./Wordmark";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Wordmark />
        {mainNav.length > 0 && (
          <nav aria-label="Main">
            <ul className="flex items-center gap-6 text-sm font-medium">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}
