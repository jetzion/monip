import { formatPhone } from "./phone";

export type InquiryInput = {
  name: string;
  email: string;
  company: string;
  phone: string;
  message: string;
};

export type InquiryErrors = Partial<Record<keyof InquiryInput, string>>;

export type InquiryValidation =
  | { ok: true; data: InquiryInput }
  | { ok: false; errors: InquiryErrors; data: InquiryInput };

const EMAIL =
  /^[\w!#$%&'*+/=?^`{|}~-]+(\.[\w!#$%&'*+/=?^`{|}~-]+)*@([A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;

/** Returns an error message for an email address, or undefined when valid. */
export function emailError(email: string): string | undefined {
  if (!email) return "Enter your email address.";
  if (email.length > 254 || !EMAIL.test(email))
    return "Enter a valid email address, like name@company.com.";
}

const text = (form: FormData, key: keyof InquiryInput) => {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
};

/** Validates inquiry form fields. Runs on the server for every submission. */
export function validateInquiry(form: FormData): InquiryValidation {
  const data: InquiryInput = {
    name: text(form, "name"),
    email: text(form, "email"),
    company: text(form, "company"),
    phone: formatPhone(text(form, "phone")),
    message: text(form, "message"),
  };
  const errors: InquiryErrors = {};

  if (!data.name) errors.name = "Enter your name.";
  else if (data.name.length > 100) errors.name = "Use 100 characters or fewer.";

  const email = emailError(data.email);
  if (email) errors.email = email;

  if (data.company.length > 120) errors.company = "Use 120 characters or fewer.";

  const phone = text(form, "phone");
  if (phone && (/[^0-9()\-.\s:+ext]/i.test(phone) || data.phone.replace(/\D/g, "").length < 10))
    errors.phone = "Enter a 10-digit phone number, with an extension if needed.";

  if (data.message.length < 10) errors.message = "Tell us a little more (at least 10 characters).";
  else if (data.message.length > 5000) errors.message = "Use 5,000 characters or fewer.";

  return Object.keys(errors).length > 0 ? { ok: false, errors, data } : { ok: true, data };
}
