/** OpenAI-compatible message; content may mix text and images. */
export type ModelMessage = {
  role: "user" | "assistant";
  content: string | ({ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } })[];
};

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const TIMEOUT_MS = 30_000;
/** Default cap on reply length (and cost) per request. */
const MAX_REPLY_TOKENS = 600;

export type ChatFailure = "not_configured" | "rate_limited" | "unavailable";

export type ChatCompletion = { ok: true; reply: string; model?: string } | { ok: false; failure: ChatFailure };

type Options = {
  system: string;
  messages: ModelMessage[];
  siteUrl: string;
  maxTokens?: number;
  /** OpenRouter model ids tried in order (at most 3); defaults to OPENROUTER_MODEL. */
  models?: string[];
};

/**
 * Sends the conversation to OpenRouter (OpenAI-compatible Chat Completions).
 * Server-only: reads OPENROUTER_API_KEY and OPENROUTER_MODEL. Failures are
 * reduced to a reason code so no upstream detail reaches the browser.
 */
export async function completeChat({ system, messages, siteUrl, maxTokens = MAX_REPLY_TOKENS, models }: Options): Promise<ChatCompletion> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const envModel = process.env.OPENROUTER_MODEL;
  const ids = models ?? (envModel ? [envModel] : []);
  if (!apiKey || ids.length === 0) return { ok: false, failure: "not_configured" };

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
        ...(ids.length === 1 ? { model: ids[0] } : { models: ids }),
        messages: [{ role: "system", content: system }, ...messages],
        max_tokens: maxTokens,
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

  const { reply, model } = await readReply(response);
  if (!reply) {
    console.error("OpenRouter returned no message content");
    return { ok: false, failure: "unavailable" };
  }
  return { ok: true, reply, model };
}

/** Reads the reply text and the model that wrote it (it may be a fallback). */
async function readReply(response: Response): Promise<{ reply: string | null; model?: string }> {
  try {
    const data = (await response.json()) as { model?: string; choices?: { message?: { content?: unknown } }[] };
    const content = data.choices?.[0]?.message?.content;
    return { reply: typeof content === "string" && content.trim() ? content.trim() : null, model: data.model };
  } catch {
    return { reply: null };
  }
}
