export type ChatMessage = { role: "user" | "assistant"; content: string };

export const CHAT_LIMITS = {
  /** Most recent messages kept; older ones are dropped before calling the model. */
  maxMessages: 20,
  maxMessageLength: 2000,
  maxBodyBytes: 64_000,
} as const;

export type ChatRequestValidation =
  | { ok: true; messages: ChatMessage[] }
  | { ok: false; error: string };

const isMessage = (value: unknown): value is ChatMessage => {
  if (typeof value !== "object" || value === null) return false;
  const { role, content } = value as Record<string, unknown>;
  return (role === "user" || role === "assistant") && typeof content === "string";
};

/**
 * Validates a chat request body: `{ messages: [{ role, content }] }`.
 * Only user and assistant roles are accepted; the system prompt is set on the server.
 */
export function validateChatRequest(body: unknown): ChatRequestValidation {
  const messages = (body as { messages?: unknown } | null)?.messages;
  if (!Array.isArray(messages) || messages.length === 0 || !messages.every(isMessage)) {
    return { ok: false, error: "Send a list of user and assistant messages." };
  }
  const recent = messages
    .slice(-CHAT_LIMITS.maxMessages)
    .map((message) => ({ role: message.role, content: message.content.trim() }));
  if (recent.some((message) => !message.content)) {
    return { ok: false, error: "Messages cannot be empty." };
  }
  if (recent.some((message) => message.content.length > CHAT_LIMITS.maxMessageLength)) {
    return { ok: false, error: `Keep each message under ${CHAT_LIMITS.maxMessageLength} characters.` };
  }
  if (recent.at(-1)?.role !== "user") {
    return { ok: false, error: "The last message must be from the user." };
  }
  return { ok: true, messages: recent };
}
