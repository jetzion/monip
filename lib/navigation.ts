type NavItem = { href: string; label: string };

/** Primary navigation. Add an item only once its page exists. */
export const mainNav: NavItem[] = [{ href: "/products", label: "Products" }];

export const footerNav: NavItem[] = [
  { href: "/products", label: "Products" },
  { href: "/contact", label: "Contact" },
];
