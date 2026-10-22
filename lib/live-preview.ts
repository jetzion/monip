import type { LivePreviewConfig } from "payload";

import { previewUrl } from "./preview-path";
import { siteUrl } from "./site";

/** Admin Live Preview settings for a collection whose page path comes from its data. */
export const livePreview = (
  pathFor: (data: Record<string, unknown>) => string | null,
): LivePreviewConfig => ({
  url: ({ data }) => {
    const path = pathFor(data);
    return path ? previewUrl(siteUrl(), path) : null;
  },
});

/** Autosave interval (ms) so Live Preview updates while editing. */
export const autosaveDrafts = { drafts: { autosave: { interval: 800 } } } as const;
