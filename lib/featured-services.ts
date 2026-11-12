/** IDs of the services an editor chose, from a relationship value (IDs or populated docs). */
export function chosenIds(value: (number | { id: number })[] | null | undefined): number[] {
  return (value ?? []).map((item) => (typeof item === "number" ? item : item.id));
}

/** Returns the docs in the order of `ids`, skipping IDs with no doc (unpublished or deleted). */
export function inChosenOrder<T extends { id: number }>(docs: T[], ids: number[]): T[] {
  const byId = new Map(docs.map((doc) => [doc.id, doc]));
  return ids.flatMap((id) => byId.get(id) ?? []);
}
