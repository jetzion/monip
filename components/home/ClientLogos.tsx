import { cn } from "cn";
import type { CSSProperties } from "react";

import { CmsImage } from "@/components/media/CmsImage";
import { logoHeight } from "@/lib/client-logo";
import { populated } from "@/lib/payload";
import type { Client, Media } from "@/payload-types";

type ClientLogo = Pick<Client, "id" | "name" | "logo">;

/** Fewer logos than this are repeated so one copy of the list is wider than the strip. */
const MIN_PER_LOOP = 8;
const SECONDS_PER_LOGO = 5;

/** One copy of the list; repeats (beyond the first `count`) are hidden when not moving. */
function LogoList({ logos, count, hidden }: { logos: ClientLogo[]; count: number; hidden?: boolean }) {
  return (
    <ul
      aria-hidden={hidden || undefined}
      className={cn(
        "flex shrink-0 items-center gap-12 pr-12",
        hidden ? "motion-reduce:hidden" : "motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-x-8 motion-reduce:gap-y-6 motion-reduce:pr-0",
      )}
    >
      {logos.map((client, index) => (
        <li
          key={`${client.id}-${index}`}
          className={cn("flex h-16 shrink-0 items-center", index >= count && "motion-reduce:hidden")}
        >
          <div
            className="flex opacity-70 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0"
            style={{ height: logoHeight(populated<Media>(client.logo), 0.75) }}
          >
            <CmsImage image={client.logo} sizes="160px" className="h-full w-auto object-contain" />
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * Homepage band of all client logos scrolling in the editors' order (keyframes in globals.css),
 * greyscale until hovered and paused on hover. With reduced motion it stands still.
 */
export function ClientLogos({ clients, intro }: { clients: ClientLogo[]; intro?: string | null }) {
  const repeats = Math.ceil(MIN_PER_LOOP / clients.length);
  const logos = Array.from({ length: repeats }, () => clients).flat();
  return (
    <section aria-labelledby="clients-heading" className="border-b border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
        <h2 id="clients-heading" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Our clients
        </h2>
        {intro && <p className="mt-1 text-sm text-muted-foreground">{intro}</p>}
        <div
          className="logo-marquee mt-2 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] motion-reduce:[mask-image:none]"
          style={{ "--marquee-duration": `${logos.length * SECONDS_PER_LOGO}s` } as CSSProperties}
        >
          <div className="logo-marquee-track flex w-max motion-reduce:w-full">
            <LogoList logos={logos} count={clients.length} />
            <LogoList logos={logos} count={clients.length} hidden />
          </div>
        </div>
      </div>
    </section>
  );
}
