"use client";

import { RefreshRouteOnSave as PayloadLivePreview } from "@payloadcms/live-preview-react";
import { useRouter } from "next/navigation";

/** Re-renders the page from the server whenever the editor saves in the admin. */
export function RefreshRouteOnSave({ serverURL }: { serverURL: string }) {
  const router = useRouter();
  return <PayloadLivePreview refresh={() => router.refresh()} serverURL={serverURL} />;
}
