"use server";

import { getPayloadClient } from "@/lib/payload";
import { getProductBySlug } from "@/lib/queries/products";
import { siteUrl } from "@/lib/site";
import { validateInquiry, type InquiryErrors, type InquiryInput } from "@/lib/validation/inquiry";

import { autoReplyEmail, notificationEmail } from "./emails";

export type InquiryState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string; errors?: InquiryErrors; values?: InquiryInput };

/**
 * Saves an inquiry, then emails MONIP and sends a fixed auto-reply.
 * Success is reported only after the inquiry is saved.
 */
export async function submitInquiry(
  _previous: InquiryState,
  form: FormData,
): Promise<InquiryState> {
  // Honeypot: hidden from people, often filled by bots. Accept silently.
  if (form.get("website")) return { status: "success" };

  const result = validateInquiry(form);
  if (!result.ok) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      errors: result.errors,
      values: result.data,
    };
  }

  const slug = form.get("productSlug");
  const product = typeof slug === "string" && slug ? await getProductBySlug(slug) : null;
  if (slug && !product) {
    return { status: "error", message: "This product is no longer available." };
  }
  const productRef = product
    ? { name: product.name, url: `${siteUrl()}/products/${product.slug}` }
    : null;

  const payload = await getPayloadClient();
  const inquiry = await payload.create({
    collection: "inquiries",
    overrideAccess: true,
    data: {
      ...result.data,
      type: product ? "product" : "general",
      product: product?.id,
      productName: productRef?.name,
      productUrl: productRef?.url,
    },
  });

  const emailStatus = await sendEmails(result.data.email, notificationEmail(result.data, productRef));
  await payload.update({
    collection: "inquiries",
    id: inquiry.id,
    overrideAccess: true,
    data: { emailStatus },
  });

  return { status: "success" };
}

async function sendEmails(
  visitorEmail: string,
  notification: { subject: string; text: string },
): Promise<"sent" | "failed"> {
  const payload = await getPayloadClient();
  const recipient = process.env.INQUIRY_NOTIFY_EMAIL;
  if (!recipient) {
    payload.logger.error("INQUIRY_NOTIFY_EMAIL is not set; inquiry saved without notification.");
    return "failed";
  }
  // Without Resend, Payload only logs emails; in production that is not delivery.
  if (process.env.NODE_ENV === "production" && !process.env.RESEND_API_KEY) {
    payload.logger.error("RESEND_API_KEY is not set; inquiry saved without notification.");
    return "failed";
  }
  // Log failures without the visitor's personal details.
  let status: "sent" | "failed" = "sent";
  try {
    await payload.sendEmail({ to: recipient, replyTo: visitorEmail, ...notification });
  } catch (error) {
    payload.logger.error({ err: error }, "Inquiry notification email failed.");
    status = "failed";
  }
  try {
    await payload.sendEmail({ to: visitorEmail, ...autoReplyEmail() });
  } catch (error) {
    payload.logger.error({ err: error }, "Inquiry auto-reply email failed.");
  }
  return status;
}
