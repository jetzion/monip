import { ViewTransition } from "react";

type Props = { name: string; children: React.ReactNode };

/** Gives a card image and its detail page image the same name, so the photo morphs between pages. */
export function ImageMorph({ name, children }: Props) {
  return (
    <ViewTransition name={name} share="image-morph" default="none">
      {children}
    </ViewTransition>
  );
}
