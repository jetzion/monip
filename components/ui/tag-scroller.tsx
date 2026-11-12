"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = {
  /** Number of tags; arrows appear only when there are more than fit. */
  count: number;
  label: string;
  children: React.ReactNode;
};

export const VISIBLE_TAGS = 4;

const arrowClassName =
  "flex size-7 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10";

/** One row of tags (e.g. catalog categories), 4 visible; scrolls sideways when there are more. */
export function TagScroller({ count, label, children }: Props) {
  const list = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: count <= VISIBLE_TAGS });
  const scrollable = count > VISIBLE_TAGS;

  const updateEdges = () => {
    const el = list.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 1, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 });
  };

  // Bring the selected tag into view when the page loads.
  useEffect(() => {
    const el = list.current;
    const active = el?.querySelector<HTMLElement>("[aria-current='page']")?.parentElement;
    if (el && active && active.offsetLeft + active.offsetWidth > el.clientWidth) {
      el.scrollLeft = active.offsetLeft;
    }
    updateEdges();
  }, []);

  const scrollBy = (direction: 1 | -1) => {
    list.current?.scrollBy({ left: direction * list.current.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="flex items-center gap-2">
      {scrollable && (
        <button
          type="button"
          aria-label={`Previous ${label}`}
          className={arrowClassName}
          disabled={edges.start}
          onClick={() => scrollBy(-1)}
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
      )}
      <ul
        ref={list}
        aria-label={label.charAt(0).toUpperCase() + label.slice(1)}
        onScroll={updateEdges}
        className="relative flex min-w-0 flex-1 snap-x snap-mandatory gap-2 overflow-x-auto [scrollbar-width:none]"
      >
        {children}
      </ul>
      {scrollable && (
        <button
          type="button"
          aria-label={`Next ${label}`}
          className={arrowClassName}
          disabled={edges.end}
          onClick={() => scrollBy(1)}
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
