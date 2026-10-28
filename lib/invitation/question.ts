import type { ChatInvitation } from "../../payload-types";

export type InvitationPage = keyof NonNullable<ChatInvitation["questions"]>;

export type InvitationSettings = Pick<ChatInvitation, "enabled" | "questions" | "picks">;

/**
 * The question a page shows, or null for no invitation. Uses the AI's pick
 * while it is still one of the page's questions, otherwise the first question.
 * `detailPick` is the pick saved on a product or success story.
 */
export function invitationQuestion(
  settings: InvitationSettings,
  page: InvitationPage,
  detailPick?: string | null,
): string | null {
  if (!settings.enabled) return null;
  const questions = (settings.questions?.[page] ?? []).map(({ question }) => question);
  const pick = page === "product" || page === "story" ? detailPick : settings.picks?.[page];
  return pick && questions.includes(pick) ? pick : (questions[0] ?? null);
}
