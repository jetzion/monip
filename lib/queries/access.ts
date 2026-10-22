import { draftMode, headers } from "next/headers";

import { getPayloadClient } from "@/lib/payload";

/**
 * Local API options for public pages. Drafts are returned only in draft
 * mode AND for a logged-in Payload user; access rules still apply because
 * the query runs as that user with overrideAccess: false.
 */
export async function contentAccess() {
  const { isEnabled } = await draftMode();
  if (isEnabled) {
    const payload = await getPayloadClient();
    const { user } = await payload.auth({ headers: await headers() });
    if (user) return { overrideAccess: false, draft: true, user } as const;
  }
  return { overrideAccess: false, draft: false } as const;
}
