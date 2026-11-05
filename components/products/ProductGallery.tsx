"use client";

import { cn } from "cn";
import Image from "next/image";
import { useState } from "react";

import { ImageMorph } from "@/components/media/ImageMorph";

export type GalleryImage = { url: string; alt: string; width: number; height: number; name: string | null };

type Props = { images: GalleryImage[]; morphName: string };

/**
 * Large preview with a row of thumbnails below. Clicking a thumbnail shows it
 * in the preview; the selected thumbnail is outlined and its name underlined.
 */
export function ProductGallery({ images, morphName }: Props) {
  const [selected, setSelected] = useState(0);
  const current = images[selected];
  if (!current) return null;

  return (
    <div className="flex flex-col gap-4">
      <ImageMorph name={morphName}>
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
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
                  onClick={() => setSelected(index)}
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
