import type { Endpoint, PayloadRequest } from "payload";
import sharp from "sharp";

import { completeChat, type ChatCompletion, type ModelMessage } from "../chat/openrouter";
import { createRateLimiter } from "../chat/rate-limit";
import { siteUrl } from "../site";

import { freeVisionModels } from "./free-models";
import {
  DESCRIBE_SYSTEM_PROMPT,
  describePrompt,
  hasDescribeInput,
  textToLexical,
  type DescribeInput,
  type DescribeRequest,
} from "./product-description";

const MAX_IMAGES = 4;
const IMAGE_SIZE_PX = 1024;
const allow = createRateLimiter({ limit: 10, windowMs: 60_000 });

const fail = (status: number, error: string) => Response.json({ error }, { status });

/** OpenRouter accepts at most 3 fallback models per request. */
const MODELS_PER_REQUEST = 3;

/** Model groups to try in order: free vision models, then the paid OPENROUTER_MODEL. */
async function modelGroups(): Promise<string[][]> {
  const free = await freeVisionModels();
  const groups: string[][] = [];
  for (let i = 0; i < free.length; i += MODELS_PER_REQUEST) groups.push(free.slice(i, i + MODELS_PER_REQUEST));
  const paid = process.env.OPENROUTER_MODEL;
  if (paid) groups.push([paid]);
  return groups;
}

/** Asks each model group in turn and returns the first reply. */
async function writeDescription(messages: ModelMessage[]): Promise<ChatCompletion> {
  let last: ChatCompletion = { ok: false, failure: "not_configured" };
  for (const models of await modelGroups()) {
    last = await completeChat({ system: DESCRIBE_SYSTEM_PROMPT, messages, siteUrl: siteUrl(), maxTokens: 400, models });
    if (last.ok) {
      console.info(`Describe: written by ${last.model ?? models.join(", ")}`);
      return last;
    }
  }
  return last;
}

async function categoryTitle(req: PayloadRequest, id?: number | null) {
  if (!id) return undefined;
  const category = await req.payload.findByID({ collection: "categories", id, depth: 0, req });
  return category.title;
}

/** Loads the images and shrinks them to JPEG data URLs the model can read. */
async function imageDataUrls(req: PayloadRequest, ids: number[]): Promise<string[]> {
  if (ids.length === 0) return [];
  const { docs } = await req.payload.find({
    collection: "media",
    where: { id: { in: ids } },
    depth: 0,
    limit: ids.length,
    req,
  });
  const urls = ids.map((id) => docs.find((doc) => doc.id === id)?.url).filter((url): url is string => Boolean(url));
  return Promise.all(
    urls.map(async (url) => {
      const response = await fetch(new URL(url, siteUrl()));
      if (!response.ok) throw new Error(`Image fetch returned HTTP ${response.status}`);
      const jpeg = await sharp(Buffer.from(await response.arrayBuffer()))
        .resize(IMAGE_SIZE_PX, IMAGE_SIZE_PX, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();
      return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
    }),
  );
}

/** POST /api/products/describe: writes a draft description; logged-in editors only. */
export const describeEndpoint: Endpoint = {
  path: "/describe",
  method: "post",
  handler: async (req) => {
    if (!req.user) return fail(401, "Log in to use this feature.");
    if (!allow(String(req.user.id))) return fail(429, "Too many requests. Please wait a minute.");

    const body = (await req.json?.()) as DescribeRequest;
    const imageIds = (Array.isArray(body.imageIds) ? body.imageIds : []).filter(Number.isInteger).slice(0, MAX_IMAGES);
    const input: DescribeInput = {
      ...body,
      category: await categoryTitle(req, body.categoryId),
      subcategory: await categoryTitle(req, body.subcategoryId),
    };
    if (!hasDescribeInput(input, imageIds.length)) return fail(400, "Add an image or product details first.");

    const images = await imageDataUrls(req, imageIds);
    const completion = await writeDescription([
      {
        role: "user",
        content: [
          ...images.map((url) => ({ type: "image_url" as const, image_url: { url } })),
          { type: "text" as const, text: describePrompt(input, images.length) },
        ],
      },
    ]);
    if (!completion.ok && completion.failure === "rate_limited") {
      return fail(503, "The AI models are busy. Please try again in a minute.");
    }
    if (!completion.ok) return fail(503, "The AI service is not available right now. Please try again later.");
    return Response.json({ description: textToLexical(completion.reply) });
  },
};
