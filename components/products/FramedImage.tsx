import { cn } from "cn";
import Image from "next/image";

import { type ContentBox, completeBox, framedImageStyle, scaleSizes } from "@/lib/media/frame";

export type FramedImageData = {
  url: string;
  alt: string;
  width: number;
  height: number;
  contentBox?: Partial<Record<keyof ContentBox, number | null>> | null;
};

type Props = {
  image: FramedImageData;
  sizes: string;
  eager?: boolean;
  /** Extra classes for the 4:3 frame. */
  className?: string;
  /** Extra classes for the image, e.g. a hover zoom. */
  imageClassName?: string;
};

/**
 * Product image in a white 4:3 frame. When the product's position in the photo
 * is known, it is zoomed to fill the frame with the same margin on every image;
 * otherwise the whole photo is fitted inside.
 */
export function FramedImage({ image, sizes, eager, className, imageClassName }: Props) {
  const box = completeBox(image.contentBox);
  const style = box ? framedImageStyle(box, image.width, image.height) : undefined;
  return (
    <div className={cn("relative aspect-[4/3] overflow-hidden bg-white", className)}>
      <Image
        src={image.url}
        alt={image.alt}
        width={image.width}
        height={image.height}
        sizes={style ? scaleSizes(sizes, Number.parseFloat(style.width) / 100) : sizes}
        loading={eager ? "eager" : "lazy"}
        style={style}
        className={cn(style ? "absolute max-w-none" : "h-full w-full object-contain", imageClassName)}
      />
    </div>
  );
}
