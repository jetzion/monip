/**
 * Paths the preview route may redirect to: same-site pages only. Rejects
 * protocol-relative (//evil.com), absolute URLs, and unexpected characters.
 */
const SAFE_PATH = /^\/(?!\/)[a-z0-9\-/]*$/;

export const isSafePreviewPath = (path: string | null): path is string =>
  typeof path === "string" && path.length <= 200 && SAFE_PATH.test(path);

/** Admin Live Preview URL for a site path. */
export const previewUrl = (siteUrl: string, path: string) =>
  `${siteUrl}/preview?path=${encodeURIComponent(path)}`;
