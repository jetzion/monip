import { describe, expect, it, vi } from "vitest";

// Not exported by the package; patched in patches/@payloadcms__storage-vercel-blob@*.patch.
import { authorizeClientOverwrite } from "../../node_modules/@payloadcms/storage-vercel-blob/dist/authorizeFileOverwrite.js";

describe("Vercel Blob client upload overwrite (patched)", () => {
  it("never overwrites, even when the filename matches an editable media doc", async () => {
    const find = vi.fn().mockResolvedValue({ docs: [{ id: 111, filename: "155 N E_T.png", prefix: "" }] });
    const req = { payload: { find, collections: { media: { config: { access: { update: () => true } } } } } };

    const allowed = await authorizeClientOverwrite({
      collectionPrefix: "",
      collections: { media: true },
      req: req as never,
      requestedCollectionSlug: "media",
      requestedFilename: "155 N E_T.png",
      requestedStorageFilePath: "155 N E_T.png",
    });

    expect(allowed).toBe(false);
  });
});
