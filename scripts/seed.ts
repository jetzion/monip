/**
 * Seeds clearly marked placeholder content for local development: catalog,
 * services, success stories, the About, Our clients, Success Stories, and Privacy pages, and
 * the homepage copy. Each part is
 * skipped if it already exists. MONIP replaces these via the admin.
 * Run with: pnpm seed
 */
import config from "@payload-config";
import { getPayload } from "payload";
import sharp from "sharp";

import type { PageKey } from "../collections/Pages";
import { toSlug } from "../lib/slug";
import type { Page } from "../payload-types";

if (process.env.NODE_ENV === "production") {
  throw new Error("Refusing to seed placeholder content in production.");
}

const payload = await getPayload({ config });

// Hooks call Next.js revalidation, which is unavailable outside the app.
const context = { disableRevalidate: true };

const PLACEHOLDER = "Development placeholder. Replace with approved MONIP content.";

/** Builds a grey PNG labelled PLACEHOLDER so it cannot pass as real imagery. */
const placeholderImage = async (label: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900">
    <rect width="100%" height="100%" fill="#e5e7eb"/>
    <text x="50%" y="46%" font-family="sans-serif" font-size="72" fill="#6b7280" text-anchor="middle">PLACEHOLDER</text>
    <text x="50%" y="58%" font-family="sans-serif" font-size="40" fill="#9ca3af" text-anchor="middle">${label}</text>
  </svg>`;
  const data = await sharp(Buffer.from(svg)).png().toBuffer();
  return payload.create({
    collection: "media",
    data: { alt: `Placeholder image for ${label}` },
    file: { data, mimetype: "image/png", name: `placeholder-${toSlug(label)}.png`, size: data.length },
  });
};

/** Minimal Lexical rich text made of plain paragraphs. */
const richText = (...paragraphs: string[]): NonNullable<Page["body"]> => ({
  root: {
    type: "root",
    format: "",
    indent: 0,
    version: 1,
    direction: "ltr",
    children: paragraphs.map((text) => ({
      type: "paragraph",
      format: "",
      indent: 0,
      version: 1,
      direction: "ltr",
      textFormat: 0,
      textStyle: "",
      children: [{ type: "text", text, format: 0, style: "", mode: "normal", detail: 0, version: 1 }],
    })),
  },
});

const exists = async (collection: "categories" | "services" | "success-stories", slug: string) =>
  (await payload.count({ collection, where: { slug: { equals: slug } } })).totalDocs > 0;

async function seedCatalog() {
  if (await exists("categories", "placeholder-category-a")) return "catalog exists";
  const createCategory = (title: string, parent?: number) =>
    payload.create({ collection: "categories", context, data: { title, slug: toSlug(title), parent } });
  const catA = await createCategory("Placeholder Category A");
  const catB = await createCategory("Placeholder Category B");
  const subA1 = await createCategory("Placeholder Subcategory A1", catA.id);

  const products = [
    { n: 1, category: catA.id, subcategory: subA1.id, featured: true },
    { n: 2, category: catA.id, subcategory: subA1.id, featured: true },
    { n: 3, category: catA.id, featured: false },
    { n: 4, category: catB.id, featured: true },
    { n: 5, category: catB.id, featured: false },
  ];
  for (const { n, ...rest } of products) {
    const image = await placeholderImage(`Product ${n}`);
    await payload.create({
      collection: "products",
      context,
      data: {
        name: `Placeholder Product ${n}`,
        slug: `placeholder-product-${n}`,
        summary: PLACEHOLDER,
        primaryImage: image.id,
        _status: "published",
        ...rest,
      },
    });
  }
  return `seeded 3 categories and ${products.length} products`;
}

async function seedServices() {
  if (await exists("services", "placeholder-service-1")) return "services exist";
  for (const n of [1, 2, 3]) {
    await payload.create({
      collection: "services",
      context,
      data: {
        title: `Placeholder Service ${n}`,
        slug: `placeholder-service-${n}`,
        sortOrder: n,
        summary: PLACEHOLDER,
        body: richText(PLACEHOLDER),
        _status: "published",
      },
    });
  }
  return "seeded 3 services";
}

async function seedStories() {
  if (await exists("success-stories", "placeholder-story-1")) return "success stories exist";
  for (const n of [1, 2, 3]) {
    const image = await placeholderImage(`Success story ${n}`);
    await payload.create({
      collection: "success-stories",
      context,
      data: {
        title: `Placeholder Success Story ${n}`,
        slug: `placeholder-story-${n}`,
        summary: PLACEHOLDER,
        featuredImage: image.id,
        body: richText(PLACEHOLDER),
        industry: "Placeholder industry",
        _status: "published",
      },
    });
  }
  return "seeded 3 success stories";
}

async function seedPages() {
  const pages: { key: PageKey; title: string }[] = [
    { key: "about", title: "About MONIP Group (placeholder)" },
    { key: "clients", title: "Our clients (placeholder)" },
    { key: "success-stories", title: "Success Stories (placeholder)" },
    { key: "privacy", title: "Privacy policy (placeholder)" },
  ];
  const created: string[] = [];
  for (const { key, title } of pages) {
    const found = await payload.count({ collection: "pages", where: { key: { equals: key } } });
    if (found.totalDocs > 0) continue;
    await payload.create({
      collection: "pages",
      context,
      data: { key, title, intro: PLACEHOLDER, body: richText(PLACEHOLDER), _status: "published" },
    });
    created.push(key);
  }
  return created.length ? `seeded pages: ${created.join(", ")}` : "pages exist";
}

/** Publishes the homepage copy defaults (migrations do this on new databases). */
async function seedHome() {
  const home = await payload.findGlobal({ slug: "home", overrideAccess: false, draft: false });
  if (home._status === "published") return "home exists";
  await payload.updateGlobal({ slug: "home", context, data: { _status: "published" } });
  return "published home page defaults";
}

for (const step of [seedCatalog, seedServices, seedStories, seedPages, seedHome]) {
  payload.logger.info(`Seed: ${await step()}`);
}
process.exit(0);
