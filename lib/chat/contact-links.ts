/** A contact-page URL, with optional trailing slash, not followed by more path or a word character. */
const CONTACT_URL = /https?:\/\/[^\s/]+\/contact\/?(?![\w/-])/g;

export type ReplyPart = { type: "text"; text: string } | { type: "contact" };

/**
 * Splits an assistant reply so contact-page URLs can render as a
 * "Contact us" link. The link always targets this site's /contact,
 * whatever host the model wrote.
 */
export function splitContactLinks(reply: string): ReplyPart[] {
  const parts: ReplyPart[] = [];
  let last = 0;
  for (const match of reply.matchAll(CONTACT_URL)) {
    if (match.index > last) parts.push({ type: "text", text: reply.slice(last, match.index) });
    parts.push({ type: "contact" });
    last = match.index + match[0].length;
  }
  if (last < reply.length) parts.push({ type: "text", text: reply.slice(last) });
  return parts;
}
