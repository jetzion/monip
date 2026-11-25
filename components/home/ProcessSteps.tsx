import { cn } from "cn";
import { ArrowDown, RotateCcw } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";

import { SectionHeading } from "@/components/content/SectionHeading";
import { CmsImage } from "@/components/media/CmsImage";
import { compactCardTitle } from "@/components/ui/card-title";
import type { ProcessCard } from "@/lib/process-steps";

type Props = {
  heading: string;
  cards: ProcessCard[];
  /** Link to the Services page; hidden when no service is published. */
  showAllLink: boolean;
};

/*
 * Desktop loop: 4 cards in a 2 x 2 grid (gaps 6rem x 4rem, equal rows) with a gold
 * track behind them through each card's centre. The track shows in the gaps and
 * ends in an arrowhead at the edge of the next card.
 */
const CENTRE_X = "calc((100% - 6rem) / 4)";
const CENTRE_Y = "calc((100% - 4rem) / 4)";
/** The track's box reaches half its 4px border past the card centres, so the line itself is centred on them. */
const TRACK_X = "calc((100% - 6rem) / 4 - 2px)";
const TRACK_Y = "calc((100% - 4rem) / 4 - 2px)";

/** Where each card sits, clockwise: 1 top left, 2 top right, 3 bottom right, 4 bottom left. */
const PLACES = ["", "", "lg:col-start-2 lg:row-start-2", "lg:col-start-1 lg:row-start-2"];

/** Arrowheads with their tips on the edge of the card they point into (half a gap from the centre). */
const ARROWS: { clip: string; style: CSSProperties }[] = [
  // Into 2, at its left edge.
  { clip: "polygon(0 0, 100% 50%, 0 100%)", style: { left: "calc(50% + 3rem)", top: CENTRE_Y, translate: "-100% -50%" } },
  // Into 3, at its top edge.
  { clip: "polygon(0 0, 100% 0, 50% 100%)", style: { left: `calc(100% - ${CENTRE_X})`, top: "calc(50% + 2rem)", translate: "-50% -100%" } },
  // Into 4, at its right edge.
  { clip: "polygon(100% 0, 0 50%, 100% 100%)", style: { left: "calc(50% - 3rem)", top: `calc(100% - ${CENTRE_Y})`, translate: "0 -50%" } },
  // Into 1, at its bottom edge.
  { clip: "polygon(50% 0, 100% 100%, 0 100%)", style: { left: CENTRE_X, top: "calc(50% - 2rem)", translate: "-50% 0" } },
];

/**
 * "How we work" as a cycle: one card per step, numbered beside its title, with its
 * service's photo and a link to that service on the Services page. On desktop 4
 * cards sit on a loop of clockwise arrows; otherwise they stack with arrows between
 * them and "Then back to" the first step at the end (still read by screen readers in the loop).
 */
export function ProcessSteps({ heading, cards, showAllLink }: Props) {
  const loop = cards.length === PLACES.length;
  return (
    <section aria-labelledby="process-heading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading id="process-heading">{heading}</SectionHeading>
        {showAllLink && (
          <Link href="/services" className="link-accent text-sm">
            View all services
          </Link>
        )}
      </div>
      <div className="relative mt-10">
        {loop && (
          <div aria-hidden="true" className="hidden lg:block">
            <div
              className="absolute rounded-[2.5rem] border-4 border-gold"
              style={{ left: TRACK_X, right: TRACK_X, top: TRACK_Y, bottom: TRACK_Y }}
            />
            {ARROWS.map(({ clip, style }, index) => (
              <span key={index} className="absolute z-20 size-4 bg-gold" style={{ ...style, clipPath: clip }} />
            ))}
          </div>
        )}
        <ol
          className={cn(
            "grid gap-3",
            loop ? "lg:grid-cols-2 lg:grid-rows-[1fr_1fr] lg:gap-x-24 lg:gap-y-16" : "mx-auto max-w-3xl",
          )}
        >
          {cards.map((card, index) => (
            <li key={`${card.service.id}-${index}`} className={cn("relative z-10 flex flex-col", loop && PLACES[index])}>
              <article className="group relative flex w-full flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition duration-200 hover:border-gold hover:shadow-card-hover sm:flex-row motion-safe:hover:-translate-y-1 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring has-[a:focus-visible]:ring-offset-2">
                <div className="aspect-[16/9] overflow-hidden bg-tint sm:aspect-auto sm:min-h-40 sm:w-2/5 sm:shrink-0">
                  <CmsImage
                    image={card.service.image}
                    sizes="(min-width: 1024px) 18vw, (min-width: 640px) 40vw, 100vw"
                    className="h-full w-full object-cover transition duration-300 motion-safe:group-hover:scale-[1.02]"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4 sm:px-5">
                  <div className="flex items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-gold font-semibold text-navy"
                    >
                      {index + 1}
                    </span>
                    <h3 className={`${compactCardTitle} font-semibold leading-snug text-navy`}>
                      <Link
                        href={`/services#${card.service.slug}`}
                        className="after:absolute after:inset-0 focus-visible:outline-none group-hover:text-primary"
                      >
                        {card.title}
                      </Link>
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{card.description}</p>
                </div>
              </article>
              {index < cards.length - 1 && (
                <ArrowDown aria-hidden="true" className={cn("mx-auto mt-3 size-6 text-gold", loop && "lg:hidden")} />
              )}
            </li>
          ))}
        </ol>
      </div>
      <p
        className={cn(
          "mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-navy",
          loop && "lg:sr-only",
        )}
      >
        <RotateCcw aria-hidden="true" className="size-4 text-gold" />
        Then back to {cards[0].title}
      </p>
    </section>
  );
}
