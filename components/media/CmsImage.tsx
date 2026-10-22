import Image from "next/image";

import { populated } from "@/lib/payload";
import type { Media } from "@/payload-types";

type Props = {
  image: number | Media | null | undefined;
  sizes: string;
  className?: string;
  /** Load immediately; use for above-the-fold images. */
  eager?: boolean;
};

/** Renders a Payload media item; renders nothing if it is missing. */
export function CmsImage({ image, sizes, className, eager }: Props) {
  const media = populated(image);
  if (!media?.url) return null;
  return (
    <Image
      src={media.url}
      alt={media.alt}
      width={media.width ?? 1200}
      height={media.height ?? 900}
      sizes={sizes}
      className={className}
      loading={eager ? "eager" : "lazy"}
    />
  );
}
