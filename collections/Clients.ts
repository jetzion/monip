import type { CollectionConfig } from "payload";

import { isLoggedIn, publishedOrLoggedIn } from "../access/content";
import { autosaveDrafts, livePreview } from "../lib/live-preview";
import { revalidateSite, revalidateSiteOnDelete } from "../hooks/revalidate";

export const Clients: CollectionConfig = {
  slug: "clients",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["logo", "name", "_status", "updatedAt"],
    description:
      "Client logos shown on the Our clients page, in this order. Drag the handle on the left to reorder. Publish only clients MONIP has approval to name.",
    livePreview: livePreview(() => "/clients"),
  },
  // Drag-and-drop ordering in the list; adds a hidden `_order` field.
  orderable: true,
  defaultSort: "_order",
  versions: autosaveDrafts,
  access: {
    read: publishedOrLoggedIn,
    create: isLoggedIn,
    update: isLoggedIn,
    delete: isLoggedIn,
  },
  hooks: {
    afterChange: [revalidateSite],
    afterDelete: [revalidateSiteOnDelete],
  },
  fields: [
    { name: "name", type: "text", required: true },
    {
      name: "logo",
      type: "upload",
      relationTo: "media",
      required: true,
      admin: { description: "A PNG with a transparent or white background works best." },
    },
  ],
};
