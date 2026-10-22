import Link from "next/link";

/** Text wordmark used until MONIP supplies approved logo files. */
export function Wordmark() {
  return (
    <Link
      href="/"
      className="font-display text-xl font-bold tracking-tight text-foreground"
    >
      MONIP<span className="sr-only"> Group home</span>
    </Link>
  );
}
