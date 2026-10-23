import type { CollectionConfig } from "payload";

import { isLoggedIn, publishedOrLoggedIn } from "../access/content";
import { autosaveDrafts, livePreview } from "../lib/live-preview";
import { revalidateSite, revalidateSiteOnDelete } from "../hooks/revalidate";

export const Clients: CollectionConfig = {
  slug: "clients",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "sortOrder", "_status", "updatedAt"],
    description:
      "Client logos shown on the Our clients page. Publish only clients MONIP has approval to name.",
    livePreview: livePreview(() => "/clients"),
  },
  defaultSort: "sortOrder",
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
    {
      name: "sortOrder",
      type: "number",
      defaultValue: 0,
      admin: { position: "sidebar", description: "Lower numbers appear first." },
    },
  ],
};
