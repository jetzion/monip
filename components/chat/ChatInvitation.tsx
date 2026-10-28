import { draftMode } from "next/headers";

import { InvitationBubble } from "@/components/chat/InvitationBubble";
import { invitationQuestion, type InvitationPage } from "@/lib/invitation/question";
import { getInvitationSettings } from "@/lib/queries/chat-invitation";

/**
 * Chat invitation for an eligible page; nothing when switched off, when the
 * page has no questions, or in preview (where the chat is hidden).
 * `pick` is the question saved on a product or success story.
 */
export async function ChatInvitation({ page, pick }: { page: InvitationPage; pick?: string | null }) {
  if ((await draftMode()).isEnabled) return null;
  const settings = await getInvitationSettings();
  const question = invitationQuestion(settings, page, pick);
  return question ? <InvitationBubble page={page} question={question} maxShows={settings.timesPerVisit ?? 1} /> : null;
}
