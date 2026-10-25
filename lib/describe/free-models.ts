const MODELS_URL = "https://openrouter.ai/api/v1/models";
const CACHE_MS = 60 * 60_000;

type ModelInfo = { id: string; architecture?: { input_modalities?: string[]; output_modalities?: string[] } };

let cache: { at: number; ids: string[] } | null = null;

/**
 * Free OpenRouter models that read images and write text. Content-safety
 * classifiers are skipped: they label input instead of writing copy.
 */
export function pickFreeVisionModels(models: ModelInfo[]): string[] {
  return models
    .filter(({ id, architecture }) =>
      id.endsWith(":free") &&
      !id.includes("safety") &&
      architecture?.input_modalities?.includes("image") &&
      architecture.output_modalities?.includes("text"),
    )
    .map(({ id }) => id);
}

/** Lists free vision models from OpenRouter, cached for an hour; [] if the list cannot be loaded. */
export async function freeVisionModels(now = Date.now()): Promise<string[]> {
  if (cache && now - cache.at < CACHE_MS) return cache.ids;
  try {
    const response = await fetch(MODELS_URL, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const { data } = (await response.json()) as { data: ModelInfo[] };
    cache = { at: now, ids: pickFreeVisionModels(data) };
    return cache.ids;
  } catch (error) {
    console.error("OpenRouter model list failed:", error instanceof Error ? error.message : "unknown");
    return [];
  }
}
