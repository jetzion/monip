import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/** Enforces the button standard in REQUIREMENTS.md ("Buttons") on the public site's source. */

const ROOTS = ["app/(frontend)", "components"];
const SKIP = ["components/admin", "components/ui/button.tsx"];

/** Files allowed hand-made <button>s, each a reviewed special case of the standard. */
const RAW_BUTTONS: Record<string, string> = {
  "components/chat/ChatWidget.tsx": "chat launcher (special case) and header icon buttons",
  "components/chat/InvitationBubble.tsx": "chat invitation speech bubble (special case)",
  "components/home/FeaturedCarousel.tsx": "carousel icon buttons and slide dots",
  "components/home/HeroControls.tsx": "hero pause icon button",
  "components/layout/MobileNav.tsx": "menu icon button",
  "components/products/ProductGallery.tsx": "gallery image thumbnails",
  "components/ui/tag-scroller.tsx": "compact arrows beside tag rows",
};

/** Classes that would override a variant's size, shape, or colour. */
const OVERRIDE = /(?:^|\s)(?:[a-z-]+:)*(?:h|min-h|size|px|py|p|text|bg|border|rounded|shadow|font)-/;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (SKIP.includes(path)) return [];
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx$/.test(entry.name) && !entry.name.includes(".test.") ? [path] : [];
  });
}

const files = ROOTS.flatMap(sourceFiles).map((path) => ({ path, text: readFileSync(path, "utf8") }));

describe("button standard", () => {
  it("only reviewed files hand-make <button> elements", () => {
    const raw = files.filter(({ text }) => text.includes("<button")).map(({ path }) => path);
    expect(raw.sort()).toEqual(Object.keys(RAW_BUTTONS).sort());
  });

  it("Button and ButtonLink take size and colour only from their variants", () => {
    const overrides = files.flatMap(({ path, text }) =>
      [...text.matchAll(/<(?:Button|ButtonLink)\b[^>]*?className="([^"]*)"/g)]
        .filter(([, classes]) => OVERRIDE.test(classes))
        .map(([, classes]) => `${path}: ${classes}`),
    );
    expect(overrides).toEqual([]);
  });
});
