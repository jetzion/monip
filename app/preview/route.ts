import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

import { getPayloadClient } from "@/lib/payload";
import { isSafePreviewPath } from "@/lib/preview-path";

/** Enables draft mode for logged-in Payload users, then opens the page. */
export async function GET(request: Request) {
  const path = new URL(request.url).searchParams.get("path");
  if (!isSafePreviewPath(path)) {
    return new Response("Invalid preview path.", { status: 400 });
  }

  const payload = await getPayloadClient();
  const { user } = await payload.auth({ headers: request.headers });
  if (!user) {
    return new Response("Log in to the admin to preview drafts.", { status: 401 });
  }

  (await draftMode()).enable();
  redirect(path);
}
