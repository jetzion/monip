import { ButtonLink } from "@/components/ui/button-link";
import { getNavigation } from "@/lib/navigation";

import { MobileNav } from "./MobileNav";
import { NavLinks } from "./NavLinks";
import { SiteLogo } from "./SiteLogo";

export async function SiteHeader() {
  const { main } = await getNavigation();
  return (
    <header className="site-header sticky top-0 z-50 border-b border-border bg-white/85 shadow-sm backdrop-blur-md backdrop-saturate-150 [view-transition-name:site-header]">
      <div className="header-bar mx-auto flex h-20 max-w-6xl items-center justify-between gap-8 px-4 sm:px-6">
        <SiteLogo className="header-logo h-16" />
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
