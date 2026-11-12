import { readFile } from "node:fs/promises";
import path from "node:path";

/** Public URL of a file in the Vercel Blob store that the token belongs to (Media uses no prefix). */
function blobUrl(token: string, filename: string) {
  const storeId = token.match(/^vercel_blob_rw_([a-z\d]+)_/i)?.[1]?.toLowerCase();
  if (!storeId) throw new Error("BLOB_READ_WRITE_TOKEN has an unexpected format.");
  return `https://${storeId}.public.blob.vercel-storage.com/${encodeURIComponent(filename)}`;
}

/** Reads an uploaded media file from Vercel Blob (when configured) or the local upload folder. */
export async function readStoredMedia(filename: string, staticDir: string): Promise<Buffer> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return readFile(path.resolve(staticDir, filename));
  const response = await fetch(blobUrl(token, filename));
  if (!response.ok) throw new Error(`Could not read ${filename} from Blob (${response.status}).`);
  return Buffer.from(await response.arrayBuffer());
}
