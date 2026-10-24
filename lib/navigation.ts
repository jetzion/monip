import { getAvailableSections } from "@/lib/queries/content";

type NavItem = { href: string; label: string };

/** Navigation links; optional pages appear only once they have published content. */
export async function getNavigation(): Promise<{ main: NavItem[]; footer: NavItem[] }> {
  const available = await getAvailableSections();
  const main: NavItem[] = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" },
    ...(available.services ? [{ href: "/services", label: "Services" }] : []),
    ...(available["success-stories"] ? [{ href: "/success-stories", label: "Success Stories" }] : []),
    ...(available.clients ? [{ href: "/clients", label: "Clients" }] : []),
    ...(available.about ? [{ href: "/about", label: "About" }] : []),
  ];
  const footer: NavItem[] = [
    ...main,
    { href: "/contact", label: "Contact" },
    ...(available.privacy ? [{ href: "/privacy", label: "Privacy policy" }] : []),
  ];
  return { main, footer };
}
