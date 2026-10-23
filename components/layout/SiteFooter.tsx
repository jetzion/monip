import Link from "next/link";

import { getNavigation } from "@/lib/navigation";

import { SiteLogo } from "./SiteLogo";

export async function SiteFooter() {
  const { footer } = await getNavigation();
  return (
    <footer className="mt-auto border-t-4 border-primary bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <SiteLogo className="h-14" />
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-6 text-sm">
            {footer.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-muted-foreground hover:text-foreground">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} MONIP Group
        </p>
      </div>
    </footer>
  );
}
