import type { Metadata } from "next";

import { NotFoundContent } from "@/components/layout/NotFoundContent";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { archivo } from "@/lib/fonts";

import "./(frontend)/globals.css";

export const metadata: Metadata = {
  title: "Page not found | MONIP Group",
};

/**
 * 404 for URLs that match no route. The app has two root layouts (site and
 * admin), so this renders its own document instead of using a layout.
 */
export default function GlobalNotFound() {
  return (
    <html lang="en" className={`${archivo.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className="border-b border-border">
          <div className="mx-auto flex h-20 max-w-6xl items-center px-4 sm:px-6">
            <SiteLogo />
          </div>
        </header>
        <main className="flex-1">
          <NotFoundContent />
        </main>
      </body>
    </html>
  );
}
