import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

import { isSafePreviewPath } from "@/lib/preview-path";

/** Turns off draft mode and returns to the published page. */
export async function GET(request: Request) {
  const path = new URL(request.url).searchParams.get("path");
  (await draftMode()).disable();
  redirect(isSafePreviewPath(path) ? path : "/");
}
