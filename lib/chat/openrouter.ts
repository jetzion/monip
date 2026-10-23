import type { ChatMessage } from "./validate";

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const TIMEOUT_MS = 30_000;
/** Caps reply length (and cost) per request. */
const MAX_REPLY_TOKENS = 600;

export type ChatFailure = "not_configured" | "rate_limited" | "unavailable";

export type ChatCompletion = { ok: true; reply: string } | { ok: false; failure: ChatFailure };

type Options = { system: string; messages: ChatMessage[]; siteUrl: string };

/**
 * Sends the conversation to OpenRouter (OpenAI-compatible Chat Completions).
 * Server-only: reads OPENROUTER_API_KEY and OPENROUTER_MODEL. Failures are
 * reduced to a reason code so no upstream detail reaches the browser.
 */
export async function completeChat({ system, messages, siteUrl }: Options): Promise<ChatCompletion> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL;
  if (!apiKey || !model) return { ok: false, failure: "not_configured" };

  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": siteUrl,
        "X-OpenRouter-Title": "MONIP Group website",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: system }, ...messages],
        max_tokens: MAX_REPLY_TOKENS,
        // Route only to providers that do not store or train on prompts.
        provider: { data_collection: "deny" },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    console.error("OpenRouter request failed:", error instanceof Error ? error.name : "unknown");
    return { ok: false, failure: "unavailable" };
  }

  if (!response.ok) {
    console.error(`OpenRouter returned HTTP ${response.status}`);
    return { ok: false, failure: response.status === 429 ? "rate_limited" : "unavailable" };
  }

  const reply = await readReply(response);
  if (!reply) {
    console.error("OpenRouter returned no message content");
    return { ok: false, failure: "unavailable" };
  }
  return { ok: true, reply };
}

async function readReply(response: Response): Promise<string | null> {
  try {
    const data = (await response.json()) as { choices?: { message?: { content?: unknown } }[] };
    const content = data.choices?.[0]?.message?.content;
    return typeof content === "string" && content.trim() ? content.trim() : null;
  } catch {
    return null;
  }
}
