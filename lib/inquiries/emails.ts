import type { InquiryInput } from "@/lib/validation/inquiry";

type ProductRef = { name: string; url: string } | null;

/** Internal notification sent to MONIP for each saved inquiry. */
export function notificationEmail(inquiry: InquiryInput, product: ProductRef) {
  const subject = product
    ? `New product inquiry: ${product.name}`
    : "New website inquiry";
  const lines = [
    product ? `Product: ${product.name}\n${product.url}\n` : null,
    `Name: ${inquiry.name}`,
    `Email: ${inquiry.email}`,
    inquiry.company ? `Company: ${inquiry.company}` : null,
    inquiry.phone ? `Phone: ${inquiry.phone}` : null,
    "",
    inquiry.message,
  ];
  return { subject, text: lines.filter((line) => line !== null).join("\n") };
}

/**
 * Fixed auto-reply. It never repeats anything the visitor typed, so the
 * form cannot be used to send arbitrary content to third parties.
 */
export function autoReplyEmail() {
  return {
    subject: "We received your inquiry",
    text: [
      "Thank you for contacting MONIP Group.",
      "",
      "We received your inquiry and a member of our team will reply by email.",
      "",
      "MONIP Group",
    ].join("\n"),
  };
}
