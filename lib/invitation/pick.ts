export const PICK_SYSTEM_PROMPT =
  "You choose the chat invitation question that best fits a page on the MONIP Group website (merchandising and product sourcing for businesses). Reply with the number of the question only.";

/** Prompt listing the page and the numbered questions. */
export function pickPrompt(page: string, questions: string[]): string {
  const list = questions.map((question, i) => `${i + 1}. ${question}`).join("\n");
  return `Page:\n${page}\n\nQuestions:\n${list}\n\nWhich question fits this page best? Reply with its number.`;
}

/** The question whose number starts the reply, or null when the reply is not a valid number. */
export function parsePick(reply: string, questions: string[]): string | null {
  const match = reply.trim().match(/^\d+/);
  const index = match ? Number(match[0]) - 1 : -1;
  return questions[index] ?? null;
}

/** Asks the model for a reply; null when the AI is unavailable. */
export type AskModel = (prompt: string) => Promise<string | null>;

/**
 * Picks the question that fits the page best. With one question there is
 * nothing to choose; if the AI fails, the first question is used.
 */
export async function pickQuestion(page: string, questions: string[], ask: AskModel): Promise<string | null> {
  if (questions.length <= 1) return questions[0] ?? null;
  const reply = await ask(pickPrompt(page, questions));
  return (reply && parsePick(reply, questions)) ?? questions[0];
}
