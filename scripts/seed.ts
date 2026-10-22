/**
 * Seeds clearly marked placeholder categories and products for local
 * development. MONIP replaces these with real products via the admin.
 * Run with: pnpm seed
 */
import config from "@payload-config";
import { getPayload } from "payload";
import sharp from "sharp";

import { toSlug } from "../lib/slug";

const PLACEHOLDER_SUMMARY =
  "Development placeholder. Replace with an approved MONIP product.";

if (process.env.NODE_ENV === "production") {
  throw new Error("Refusing to seed placeholder content in production.");
}

const payload = await getPayload({ config });

/** Builds a grey PNG labelled PLACEHOLDER so it cannot pass as real imagery. */
const placeholderImage = async (label: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900">
    <rect width="100%" height="100%" fill="#e5e7eb"/>
    <text x="50%" y="46%" font-family="sans-serif" font-size="72" fill="#6b7280" text-anchor="middle">PLACEHOLDER</text>
    <text x="50%" y="58%" font-family="sans-serif" font-size="40" fill="#9ca3af" text-anchor="middle">${label}</text>
  </svg>`;
  const data = await sharp(Buffer.from(svg)).png().toBuffer();
  const name = `placeholder-${label.toLowerCase().replace(/\s+/g, "-")}.png`;
  return payload.create({
    collection: "media",
    data: { alt: `Placeholder image for ${label}` },
    file: { data, mimetype: "image/png", name, size: data.length },
  });
};

const createCategory = (title: string, parent?: number) =>
  payload.create({ collection: "categories", data: { title, slug: toSlug(title), parent } });

const existing = await payload.count({
  collection: "categories",
  where: { slug: { equals: "placeholder-category-a" } },
});

if (existing.totalDocs > 0) {
  payload.logger.info("Placeholder content already exists; nothing to do.");
} else {
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
      data: {
        name: `Placeholder Product ${n}`,
        slug: `placeholder-product-${n}`,
        summary: PLACEHOLDER_SUMMARY,
        primaryImage: image.id,
        _status: "published",
        ...rest,
      },
    });
  }
  payload.logger.info(`Seeded 3 categories and ${products.length} products.`);
}

process.exit(0);
