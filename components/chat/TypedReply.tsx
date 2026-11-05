"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useState } from "react";

import { splitContactLinks } from "@/lib/chat/contact-links";

/** Milliseconds between letters while David types. */
const LETTER_MS = 30;

type Props = {
  text: string;
  /** Type the text out letter by letter; otherwise show it whole. */
  animate: boolean;
  onTyped: () => void;
  onLetter: () => void;
  onNavigate: () => void;
};

/**
 * David's message, typed out letter by letter. A contact-page URL
 * appears as one "Contact us" link, counted as a single letter.
 */
export function TypedReply({ text, animate, onTyped, onLetter, onNavigate }: Props) {
  const parts = splitContactLinks(text);
  const plain = parts.map((part) => (part.type === "text" ? part.text : "#")).join("");
  const [count, setCount] = useState(0);

  const tick = useEffectEvent((n: number) => {
    setCount(n);
    onLetter();
    if (n >= plain.length) onTyped();
  });
  const skip = useEffectEvent(() => onTyped());

  useEffect(() => {
    if (!animate) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return skip();
    let n = 0;
    const id = setInterval(() => {
      n += 1;
      tick(n);
      if (n >= plain.length) clearInterval(id);
    }, LETTER_MS);
    return () => clearInterval(id);
  }, [animate, plain.length]);

  const shown = animate ? count : plain.length;
  const nodes: React.ReactNode[] = [];
  let start = 0;
  for (const [index, part] of parts.entries()) {
    if (start >= shown) break;
    if (part.type === "text") {
      nodes.push(part.text.slice(0, shown - start));
      start += part.text.length;
    } else {
      nodes.push(
        <Link key={index} href="/contact" onClick={onNavigate} className="font-medium text-primary underline underline-offset-4">
          Contact us
        </Link>,
      );
      start += 1;
    }
  }
  return nodes;
}
