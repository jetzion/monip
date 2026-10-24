import type { SuccessStory } from "@/payload-types";

/** The customer name, only when MONIP has approval to show it. */
export const visibleCustomer = (story: Pick<SuccessStory, "customerName" | "customerApproved">) =>
  story.customerApproved && story.customerName?.trim() ? story.customerName.trim() : null;

/** Formats a CMS date as e.g. "October 24, 2026" (UTC, so the day never shifts). */
export const formatStoryDate = (value: string | null | undefined) =>
  value
    ? new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })
    : null;
