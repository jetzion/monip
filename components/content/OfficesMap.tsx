import { cn } from "cn";
import Image from "next/image";

import { labelOnLeft, MAP, mapPosition } from "@/lib/offices-map";
import type { Office } from "@/payload-types";

type Props = { offices: Pick<Office, "id" | "name" | "address" | "latitude" | "longitude">[] };

/** World map with a pin per office, followed by the office list. */
export function OfficesMap({ offices }: Props) {
  const names = offices.map((office) => office.name).join(", ");
  return (
    <section aria-labelledby="offices-heading" className="rounded-xl border border-border bg-card p-6 shadow-card sm:p-10">
      <h2 id="offices-heading" className="font-display border-l-4 border-primary pl-4 text-2xl font-semibold text-navy">
        Our offices
      </h2>

      <div
        role="img"
        aria-label={`World map showing MONIP Group offices in ${names}`}
        className="relative mt-8 overflow-hidden rounded-lg bg-tint"
        style={{ aspectRatio: `${MAP.width} / ${MAP.height}` }}
      >
        <Image src="/world-map.svg" alt="" fill unoptimized className="object-fill" />
        {offices.map((office) => {
          const { left, top } = mapPosition(office);
          const labelLeft = labelOnLeft(office, offices);
          return (
            <span key={office.id} className="absolute" style={{ left: `${left}%`, top: `${top}%` }}>
              <span className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-2 ring-primary/25 sm:size-3.5 sm:ring-4" />
              <span
                className={cn(
                  "absolute hidden -translate-y-1/2 whitespace-nowrap rounded bg-white/90 px-1.5 py-0.5 text-xs font-semibold text-navy shadow-sm sm:block",
                  labelLeft ? "right-3" : "left-3",
                )}
              >
                {office.name}
              </span>
            </span>
          );
        })}
      </div>

      <ul className="mt-8 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        {offices.map((office) => (
          <li key={office.id} className="flex gap-3">
            <span aria-hidden="true" className="mt-1.5 size-2.5 shrink-0 rounded-full bg-primary" />
            <div>
              <p className="font-semibold text-navy">{office.name}</p>
              {office.address && <p className="mt-0.5 whitespace-pre-line text-sm text-muted-foreground">{office.address}</p>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
