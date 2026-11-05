"use client";

import { cn } from "cn";
import Image from "next/image";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";

import { ImageMorph } from "@/components/media/ImageMorph";

export type GalleryImage = { url: string; alt: string; width: number; height: number; name: string | null };

type Props = { images: GalleryImage[]; morphName: string };

/** View transition name that moves from the clicked thumbnail to the preview. */
const PICK = "gallery-pick";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Large preview with a row of thumbnails below. Clicking a thumbnail morphs
 * it into the preview; the selected thumbnail is outlined and its name underlined.
 */
export function ProductGallery({ images, morphName }: Props) {
  const [selected, setSelected] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);
  const current = images[selected];
  if (!current) return null;

  /** Shares one transition name between the thumbnail (before) and the preview (after). */
  const select = (index: number, thumb: HTMLElement) => {
    const preview = previewRef.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (index === selected || !preview || reduced || !document.startViewTransition) {
      setSelected(index);
      return;
    }
    thumb.style.viewTransitionName = PICK;
    const transition = document.startViewTransition(async () => {
      thumb.style.viewTransitionName = "";
      flushSync(() => setSelected(index));
      preview.style.viewTransitionName = PICK;
      // Wait for the large image so the morph lands on the new picture.
      await Promise.race([preview.querySelector("img")?.decode(), wait(1500)]).catch(() => {});
    });
    void transition.finished.finally(() => {
      preview.style.viewTransitionName = "";
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <ImageMorph name={morphName}>
        <div ref={previewRef} className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <Image
            src={current.url}
            alt={current.alt}
            width={current.width}
            height={current.height}
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="h-auto w-full"
            loading="eager"
          />
        </div>
      </ImageMorph>
      {images.length > 1 && (
        <ul className="grid grid-cols-3 gap-4 sm:grid-cols-4">
          {images.map((image, index) => {
            const active = index === selected;
            return (
              <li key={index}>
                <button
                  type="button"
                  onClick={(event) => select(index, event.currentTarget.firstElementChild as HTMLElement)}
                  aria-pressed={active}
                  aria-label={`Show image: ${image.name || image.alt}`}
                  className="group flex w-full cursor-pointer flex-col gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <span
                    className={cn(
                      "block overflow-hidden rounded-lg border bg-card shadow-card transition-colors",
                      active ? "border-primary ring-2 ring-primary" : "border-border group-hover:border-primary/50",
                    )}
                  >
                    <Image
                      src={image.url}
                      alt=""
                      width={image.width}
                      height={image.height}
                      sizes="(min-width: 640px) 15vw, 33vw"
                      className="h-auto w-full"
                    />
                  </span>
                  {image.name && (
                    <span
                      className={cn(
                        "text-center text-sm underline-offset-4",
                        active ? "font-medium text-foreground underline decoration-primary decoration-2" : "text-muted-foreground",
                      )}
                    >
                      {image.name}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
