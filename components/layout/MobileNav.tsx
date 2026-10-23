"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { NavLinks } from "./NavLinks";

type Props = { items: { href: string; label: string }[] };

/** Disclosure menu for small screens; closes on Escape or navigation. */
export function MobileNav({ items }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen(!open)}
        className="inline-flex size-10 items-center justify-center border border-border"
      >
        {open ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
      </button>
      {open && (
        <nav
          id="mobile-nav"
          aria-label="Main"
          className="absolute inset-x-0 top-20 z-40 border-b border-border bg-white shadow-card"
        >
          <div className="mx-auto max-w-6xl px-4 py-2 sm:px-6">
            <NavLinks
              items={[...items, { href: "/contact", label: "Discuss a project" }]}
              onNavigate={() => setOpen(false)}
              variant="mobile"
            />
          </div>
        </nav>
      )}
    </div>
  );
}
