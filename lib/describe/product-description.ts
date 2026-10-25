/** Product fields the editor has entered so far, as sent by the admin form. */
export type DescribeInput = {
  name?: string;
  summary?: string;
  category?: string;
  subcategory?: string;
  tags?: string[];
  materials?: string[];
  customizationOptions?: string[];
  applications?: string[];
  specifications?: { label: string; value: string }[];
};

export const DESCRIBE_SYSTEM_PROMPT = [
  "You write product descriptions for MONIP Group, a supplier of custom promotional and branded products.",
  "Write a short, professional description of 2 or 3 short paragraphs, about 60 to 120 words in total.",
  "Describe only what the images and the supplied data show. Do not invent specifications, dimensions,",
  "certifications, sustainability claims, prices, or clients. Plain text only: no headings, lists, or markdown.",
].join(" ");

const line = (label: string, value?: string | string[]) => {
  const text = Array.isArray(value) ? value.join(", ") : value?.trim();
  return text ? `${label}: ${text}` : null;
};

/** True when there is at least one image or one piece of product data to describe. */
export function hasDescribeInput(input: DescribeInput, imageCount: number): boolean {
  return imageCount > 0 || productFacts(input).length > 0;
}

/** Lists the entered product data as "Label: value" lines, skipping empty fields. */
export function productFacts(input: DescribeInput): string[] {
  const facts = [
    line("Name", input.name),
    line("Summary", input.summary),
    line("Category", input.category),
    line("Subcategory", input.subcategory),
    line("Materials", input.materials),
    line("Customization options", input.customizationOptions),
    line("Industries / applications", input.applications),
    line("Tags", input.tags),
    ...(input.specifications ?? []).map((spec) => line(spec.label, spec.value)),
  ];
  return facts.filter((fact): fact is string => fact !== null);
}

/** The user message text sent alongside the product images. */
export function describePrompt(input: DescribeInput, imageCount: number): string {
  const facts = productFacts(input);
  return [
    imageCount > 0 ? `The attached ${imageCount} image(s) show the product.` : "No product images are available.",
    facts.length > 0 ? `Product data:\n${facts.join("\n")}` : "No product data has been entered yet.",
    "Write the product description.",
  ].join("\n\n");
}

/** Converts plain text paragraphs into a Lexical editor state for a richText field. */
export function textToLexical(text: string) {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
  return {
    root: {
      type: "root",
      format: "",
      indent: 0,
      version: 1,
      direction: "ltr",
      children: paragraphs.map((paragraph) => ({
        type: "paragraph",
        format: "",
        indent: 0,
        version: 1,
        direction: "ltr",
        textFormat: 0,
        textStyle: "",
        children: [{ type: "text", text: paragraph, format: 0, style: "", mode: "normal", detail: 0, version: 1 }],
      })),
    },
  };
}

/** Body sent by the admin button: entered fields plus related-document ids. */
export type DescribeRequest = Omit<DescribeInput, "category" | "subcategory"> & {
  categoryId?: number | null;
  subcategoryId?: number | null;
  imageIds: number[];
};
