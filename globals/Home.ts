import type { GlobalConfig } from "payload";

import { isLoggedIn, publishedOrLoggedIn } from "../access/content";
import { revalidateHome } from "../hooks/revalidate";
import { autosaveDrafts, livePreview } from "../lib/live-preview";

const label = (name: string, defaultValue: string, description?: string) => ({
  name,
  type: "text" as const,
  required: true,
  maxLength: 40,
  defaultValue,
  admin: { description },
});

/** Homepage copy. Featured products come from the Products "Featured" checkbox. */
export const Home: GlobalConfig = {
  slug: "home",
  label: "Home page",
  admin: {
    description:
      "Text on the homepage. Link destinations are fixed; featured products are chosen on each product.",
    livePreview: livePreview(() => "/"),
  },
  versions: autosaveDrafts,
  access: {
    read: publishedOrLoggedIn,
    update: isLoggedIn,
  },
  hooks: {
    afterChange: [revalidateHome],
  },
  fields: [
    {
      name: "hero",
      type: "group",
      label: "Hero (top of the page)",
      fields: [
        {
          name: "headline",
          type: "text",
          required: true,
          maxLength: 80,
          defaultValue: "Merchandising and product sourcing for business",
        },
        {
          name: "intro",
          type: "textarea",
          required: true,
          maxLength: 400,
          defaultValue:
            "MONIP Group brings together global sourcing expertise, creative product development, and strategic merchandising to help cruise lines and retail businesses stand out in competitive markets. We go beyond finding products.",
        },
        label("aboutLinkLabel", "More about MONIP Group", "Link to the About page."),
      ],
    },
    {
      name: "closing",
      type: "group",
      label: "Closing call to action",
      fields: [
        {
          name: "heading",
          type: "text",
          required: true,
          maxLength: 80,
          defaultValue: "Have a product or program in mind?",
        },
        label("buttonLabel", "Discuss a project", "Button to the contact page."),
      ],
    },
  ],
};
