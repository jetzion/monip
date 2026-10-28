import type { CollectionBeforeChangeHook, GlobalBeforeChangeHook, PayloadRequest } from "payload";

import type { ChatInvitation, Product, SuccessStory } from "../../payload-types";
import { completeChat } from "../chat/openrouter";
import { siteUrl } from "../site";

import { PICK_SYSTEM_PROMPT, pickQuestion, type AskModel } from "./pick";
import type { InvitationPage } from "./question";

export type FixedPage = Exclude<InvitationPage, "product" | "story">;

/** What each fixed page is about, for the AI. */
const fixedPageContext: Record<FixedPage, string> = {
  home: "Homepage: an overview of MONIP Group's merchandising and product sourcing services.",
  products: "Products: the catalog of product samples, by category.",
  services: "Services: the merchandising and sourcing services MONIP Group offers.",
  stories: "Success Stories: a list of past client projects.",
  about: "About: who MONIP Group is and where its offices are.",
  clients: "Clients: logos of businesses MONIP Group has worked with.",
};

export const fixedPages = Object.keys(fixedPageContext) as FixedPage[];

/** Asks OPENROUTER_MODEL for a short reply; null when not configured or failing. */
const askModel: AskModel = async (prompt) => {
  const completion = await completeChat({
    system: PICK_SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
    siteUrl: siteUrl(),
    maxTokens: 10,
    timeoutMs: 10_000,
  });
  return completion.ok ? completion.reply : null;
};

const questionsOf = (doc: Partial<ChatInvitation> | undefined, page: InvitationPage): string[] =>
  (doc?.questions?.[page] ?? []).map(({ question }) => question);

/** True when the stored pick is still one of the questions and nothing it depends on changed. */
const pickIsCurrent = (pick: string | null | undefined, questions: string[], unchanged: boolean) =>
  unchanged && Boolean(pick) && questions.includes(pick as string);

/** On save of the Chat invitation global, picks a question for each fixed page whose list changed. */
export const pickFixedPageQuestions: GlobalBeforeChangeHook = async ({ data, originalDoc }) => {
  const next = data as Partial<ChatInvitation>;
  const previous = originalDoc as ChatInvitation | undefined;
  const picks = await Promise.all(
    fixedPages.map(async (page) => {
      const questions = questionsOf(next, page);
      const pick = previous?.picks?.[page];
      const unchanged = JSON.stringify(questions) === JSON.stringify(questionsOf(previous, page));
      if (pickIsCurrent(pick, questions, unchanged)) return [page, pick] as const;
      return [page, await pickQuestion(fixedPageContext[page], questions, askModel)] as const;
    }),
  );
  return { ...data, picks: Object.fromEntries(picks) };
};

/**
 * On publish, picks the question for a detail page from that page type's
 * questions. Autosaved drafts are skipped so the AI is not called while editing.
 */
function pickOnPublish<T extends Product | SuccessStory>(
  page: "product" | "story",
  inputs: (keyof T)[],
  describe: (doc: Partial<T>, req: PayloadRequest) => Promise<string>,
): CollectionBeforeChangeHook<T> {
  return async ({ data, originalDoc, req }) => {
    if (data._status !== "published") return data;
    const doc = { ...originalDoc, ...data } as Partial<T>;
    const settings = await req.payload.findGlobal({ slug: "chat-invitation", depth: 0, req });
    const questions = questionsOf(settings, page);
    const unchanged = inputs.every((key) => JSON.stringify(doc[key]) === JSON.stringify(originalDoc?.[key]));
    if (pickIsCurrent(originalDoc?.invitationQuestion, questions, unchanged)) return data;
    return { ...data, invitationQuestion: await pickQuestion(await describe(doc, req), questions, askModel) };
  };
}

const categoryTitle = async (req: PayloadRequest, category: Product["category"] | undefined) => {
  if (!category) return "";
  if (typeof category === "object") return category.title;
  return (await req.payload.findByID({ collection: "categories", id: category, depth: 0, req })).title;
};

export const pickProductQuestion = pickOnPublish<Product>(
  "product",
  ["name", "summary", "category"],
  async (doc, req) =>
    `Product detail page.\nProduct: ${doc.name}\nCategory: ${await categoryTitle(req, doc.category)}\nSummary: ${doc.summary}`,
);

export const pickStoryQuestion = pickOnPublish<SuccessStory>(
  "story",
  ["title", "summary", "industry"],
  async (doc) => `Success story page.\nTitle: ${doc.title}\nIndustry: ${doc.industry ?? ""}\nSummary: ${doc.summary}`,
);
