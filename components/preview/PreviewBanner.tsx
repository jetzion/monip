/** Shown in draft mode so editors never mistake a preview for the live site. */
export function PreviewBanner() {
  return (
    <div role="status" className="bg-amber-100 text-amber-950">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm sm:px-6">
        <p>
          <strong>Preview mode.</strong> You are viewing unpublished drafts.
        </p>
        <a href="/exit-preview" className="font-medium underline">
          Exit preview
        </a>
      </div>
    </div>
  );
}
