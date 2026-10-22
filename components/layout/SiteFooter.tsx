import { Wordmark } from "./Wordmark";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-muted">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Wordmark />
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} MONIP Group
        </p>
      </div>
    </footer>
  );
}
