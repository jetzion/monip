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

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^[0-9+().\-\s]{7,40}$/;

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
    phone: text(form, "phone"),
    message: text(form, "message"),
  };
  const errors: InquiryErrors = {};

  if (!data.name) errors.name = "Enter your name.";
  else if (data.name.length > 100) errors.name = "Use 100 characters or fewer.";

  if (!data.email) errors.email = "Enter your email address.";
  else if (data.email.length > 254 || !EMAIL.test(data.email))
    errors.email = "Enter a valid email address, like name@company.com.";

  if (data.company.length > 120) errors.company = "Use 120 characters or fewer.";

  if (data.phone && !PHONE.test(data.phone))
    errors.phone = "Enter a valid phone number, digits and + ( ) - only.";

  if (data.message.length < 10) errors.message = "Tell us a little more (at least 10 characters).";
  else if (data.message.length > 5000) errors.message = "Use 5,000 characters or fewer.";

  return Object.keys(errors).length > 0 ? { ok: false, errors, data } : { ok: true, data };
}
