import type { GlobalConfig, NumberFieldSingleValidation } from "payload";
import { array, number } from "payload/shared";

import type { Home as HomeData } from "../payload-types";

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

type HeroFields = HomeData["hero"];

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
        {
          name: "background",
          type: "radio",
          required: true,
          defaultValue: "video",
          options: [
            { label: "Video", value: "video" },
            { label: "Images (slideshow)", value: "images" },
          ],
          admin: {
            layout: "horizontal",
            description: "What plays behind the headline. Text stays on a dark overlay so it remains readable.",
          },
        },
        {
          name: "video",
          type: "upload",
          relationTo: "media",
          filterOptions: { mimeType: { equals: "video/mp4" } },
          admin: {
            condition: (_, sibling) => sibling?.background === "video",
            description:
              "MP4 video, muted and looped. Keep it short (10 to 20 seconds) and small (under 10 MB). Leave empty to use the built-in decoration video.",
          },
        },
        {
          name: "slides",
          type: "array",
          label: "Slideshow images",
          labels: { singular: "Image", plural: "Images" },
          maxRows: 6,
          // A custom validate replaces the built-in one (maxRows), so call it first.
          validate: (value, options) => {
            const rows = array(value, options);
            if (rows !== true) return rows;
            const { background } = options.siblingData as { background?: string };
            return background !== "images" || (value?.length ?? 0) > 0 || "Add at least one image, or choose Video.";
          },
          admin: {
            condition: (_, sibling) => sibling?.background === "images",
            description: "Up to 6 JPG or PNG images, shown in this order. Drag to reorder.",
          },
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "image",
                  type: "upload",
                  relationTo: "media",
                  required: true,
                  filterOptions: { mimeType: { in: ["image/jpeg", "image/png"] } },
                  admin: { width: "70%" },
                },
                {
                  name: "seconds",
                  type: "number",
                  label: "Display time (seconds)",
                  required: true,
                  defaultValue: 6,
                  min: 2,
                  max: 30,
                  admin: { width: "30%", step: 1 },
                },
              ],
            },
          ],
        },
        {
          name: "transition",
          type: "select",
          required: true,
          defaultValue: "fade",
          options: [
            { label: "Fade", value: "fade" },
            { label: "Scale & Zoom", value: "zoom" },
            { label: "Slide-In", value: "slide" },
          ],
          admin: {
            condition: (_, sibling) => sibling?.background === "images",
            description: "How each image replaces the previous one.",
          },
        },
        {
          type: "row",
          admin: { condition: (_, sibling) => sibling?.background === "images" },
          fields: [
            {
              name: "transitionSeconds",
              type: "number",
              label: "Transition time (seconds)",
              required: true,
              defaultValue: 1.2,
              min: 0.3,
              max: 3,
              // A custom validate replaces the built-in one (min, max), so call it first.
              validate: ((value, options) => {
                const base = number(value, options);
                if (base !== true) return base;
                const siblingData = options.siblingData as Partial<HeroFields>;
                if (siblingData.background !== "images" || typeof value !== "number") return true;
                const shortest = Math.min(...(siblingData.slides ?? []).map((slide) => slide.seconds));
                return value < shortest || "Must be shorter than every image's display time.";
              }) satisfies NumberFieldSingleValidation,
              admin: {
                width: "50%",
                step: 0.1,
                description: "How long each change takes, 0.3 to 3 seconds. Must be shorter than every display time.",
              },
            },
            {
              name: "overlayOpacity",
              type: "number",
              label: "Mask opacity (%)",
              required: true,
              defaultValue: 100,
              min: 0,
              max: 100,
              admin: {
                width: "50%",
                step: 5,
                description:
                  "Strength of the dark mask over the images. Lower shows more of the image but makes the white text harder to read; check the result in Live Preview.",
              },
            },
          ],
        },
      ],
    },
    {
      name: "featuredServices",
      type: "relationship",
      label: "Featured services",
      relationTo: "services",
      hasMany: true,
      maxRows: 4,
      // IDs only: the page loads the services itself, published ones only.
      maxDepth: 0,
      admin: {
        isSortable: true,
        description:
          "Up to 4 services shown as cards above Featured products, in this order (drag to reorder). Only published services appear. Leave empty to show the first 4 by the Services sort order.",
      },
    },
  ],
};
