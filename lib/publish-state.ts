type Versioned = { _status?: "draft" | "published" | null } | null | undefined;

/**
 * Whether a save can change what the public sees. Draft-only saves
 * (including autosave while editing) do not; publishing does, and so does
 * a save on a document that was published (e.g. unpublishing).
 * Documents without drafts always count.
 */
export function affectsPublicSite(doc: Versioned, previousDoc: Versioned): boolean {
  if (!doc?._status) return true;
  return doc._status === "published" || previousDoc?._status === "published";
}
