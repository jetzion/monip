import { ButtonLink } from "@/components/ui/button-link";
import { getNavigation } from "@/lib/navigation";

import { MobileNav } from "./MobileNav";
import { NavLinks } from "./NavLinks";
import { SiteLogo } from "./SiteLogo";

export async function SiteHeader() {
  const { main } = await getNavigation();
  return (
    <header className="relative border-b border-border bg-background">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-8 px-4 sm:px-6">
        <SiteLogo />
        <div className="hidden items-center gap-8 lg:flex">
          <nav aria-label="Main">
            <NavLinks items={main} variant="desktop" />
          </nav>
          <ButtonLink href="/contact" className="h-9 px-4">
            Discuss a project
          </ButtonLink>
        </div>
        <MobileNav items={main} />
      </div>
    </header>
  );
}
