import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { completeChat } from "./openrouter";

const options = { system: "Be helpful.", messages: [{ role: "user" as const, content: "Hi" }], siteUrl: "http://localhost:3000" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe("completeChat", () => {
  beforeEach(() => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    vi.stubEnv("OPENROUTER_MODEL", "test/model");
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("sends the server system prompt, history, and model", async () => {
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(json({ choices: [{ message: { content: " Hello " } }] }));
    expect(await completeChat(options)).toEqual({ ok: true, reply: "Hello" });

    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer test-key");
    const body = JSON.parse(init?.body as string);
    expect(body.model).toBe("test/model");
    expect(body.messages).toEqual([{ role: "system", content: "Be helpful." }, { role: "user", content: "Hi" }]);
    expect(body.provider).toEqual({ data_collection: "deny" });
  });

  it("reports missing configuration without calling OpenRouter", async () => {
    vi.stubEnv("OPENROUTER_MODEL", "");
    const fetch = vi.spyOn(globalThis, "fetch");
    expect(await completeChat(options)).toEqual({ ok: false, failure: "not_configured" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("maps 429 to rate_limited and other errors to unavailable", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(json({ error: { code: 429 } }, 429));
    expect(await completeChat(options)).toEqual({ ok: false, failure: "rate_limited" });

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(json({ error: { code: 401, message: "bad key" } }, 401));
    expect(await completeChat(options)).toEqual({ ok: false, failure: "unavailable" });
  });

  it("treats network errors and malformed responses as unavailable", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new DOMException("timeout", "TimeoutError"));
    expect(await completeChat(options)).toEqual({ ok: false, failure: "unavailable" });

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("not json"));
    expect(await completeChat(options)).toEqual({ ok: false, failure: "unavailable" });

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(json({ choices: [] }));
    expect(await completeChat(options)).toEqual({ ok: false, failure: "unavailable" });
  });

  it("never logs the API key", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(json({}, 401));
    await completeChat(options);
    const logged = vi.mocked(console.error).mock.calls.flat().join(" ");
    expect(logged).not.toContain("test-key");
  });
});

describe("completeChat with a model list", () => {
  beforeEach(() => vi.stubEnv("OPENROUTER_API_KEY", "test-key"));
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("sends models for fallback and reports the model that answered", async () => {
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(json({ model: "b:free", choices: [{ message: { content: "Hi" } }] }));
    expect(await completeChat({ ...options, models: ["a:free", "b:free"] })).toEqual({ ok: true, reply: "Hi", model: "b:free" });
    const body = JSON.parse(fetch.mock.calls[0][1]?.body as string);
    expect(body.models).toEqual(["a:free", "b:free"]);
    expect(body.model).toBeUndefined();
  });
});
