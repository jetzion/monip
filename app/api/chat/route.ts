import { buildSystemPrompt } from "@/lib/chat/knowledge";
import { completeChat, type ChatFailure } from "@/lib/chat/openrouter";
import { createRateLimiter } from "@/lib/chat/rate-limit";
import { CHAT_LIMITS, validateChatRequest } from "@/lib/chat/validate";
import { siteUrl } from "@/lib/site";

/** 10 messages per minute per visitor IP (in-memory; see rate-limit.ts). */
const allow = createRateLimiter({ limit: 10, windowMs: 60_000 });

const FAILURES: Record<ChatFailure, { status: number; error: string }> = {
  not_configured: { status: 503, error: "Chat is not available right now." },
  rate_limited: { status: 503, error: "Chat is busy right now. Please try again in a minute." },
  unavailable: { status: 503, error: "Chat is temporarily unavailable. Please try again later." },
};

const reply = (status: number, body: { reply: string } | { error: string }) => Response.json(body, { status });

/** Chat endpoint: `{ messages }` in, `{ reply }` or `{ error }` out. Nothing is stored. */
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (!allow(ip)) return reply(429, { error: "You are sending messages too quickly. Please wait a minute." });

  const raw = await request.text();
  if (raw.length > CHAT_LIMITS.maxBodyBytes) return reply(413, { error: "This conversation is too long. Start a new one." });

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return reply(400, { error: "Invalid request." });
  }
  const result = validateChatRequest(body);
  if (!result.ok) return reply(400, { error: result.error });

  const base = siteUrl();
  const completion = await completeChat({
    system: await buildSystemPrompt(base),
    messages: result.messages,
    siteUrl: base,
  });
  if (!completion.ok) {
    if (completion.failure === "not_configured") console.error("Chat: OPENROUTER_API_KEY or OPENROUTER_MODEL is not set.");
    const { status, error } = FAILURES[completion.failure];
    return reply(status, { error });
  }
  return reply(200, { reply: completion.reply });
}
