import Link from "next/link";

/** Shared 404 message, used inside the site layout and by the global 404. */
export function NotFoundContent() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <h1 className="font-display text-4xl font-semibold">Page not found</h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        This page does not exist or is no longer available.
      </p>
      <ul className="mt-8 flex gap-6 text-sm font-medium">
        <li>
          <Link href="/" className="text-primary underline underline-offset-4">
            Go to the homepage
          </Link>
        </li>
        <li>
          <Link href="/products" className="text-primary underline underline-offset-4">
            Browse products
          </Link>
        </li>
      </ul>
    </section>
  );
}
