import { getPayloadClient } from "@/lib/payload";
import { publicAccess } from "@/lib/queries/products";

/** Chat invitation switch, times per visit, questions, and the AI's picks for fixed pages. */
export async function getInvitationSettings() {
  const payload = await getPayloadClient();
  return payload.findGlobal({
    slug: "chat-invitation",
    ...publicAccess,
    depth: 0,
    select: { enabled: true, timesPerVisit: true, questions: true, picks: true },
  });
}
