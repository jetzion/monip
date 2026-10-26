import { describe, expect, it } from "vitest";

import { validateInquiry } from "./inquiry";

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
};

const valid = {
  name: "Alex Buyer",
  email: "alex@example.com",
  message: "We need 500 units for an event.",
};

describe("validateInquiry", () => {
  it("accepts a valid inquiry and trims values", () => {
    const result = validateInquiry(form({ ...valid, name: "  Alex Buyer  " }));
    expect(result).toEqual({
      ok: true,
      data: { ...valid, company: "", phone: "" },
    });
  });

  it("requires name, email, and message", () => {
    const result = validateInquiry(form({}));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(["email", "message", "name"]);
  });

  it.each(["not-an-email", "a@b", "a@b.c", "a..b@example.com", "a@-example.com", "a b@example.com"])(
    "rejects the invalid email %s",
    (email) => {
      const result = validateInquiry(form({ ...valid, email }));
      expect(result.ok === false && result.errors.email).toBeTruthy();
    },
  );

  it.each(["alex@example.com", "alex.b+tag@mail.example.co.uk", "o'neil@my-company.io"])(
    "accepts the valid email %s",
    (email) => {
      expect(validateInquiry(form({ ...valid, email })).ok).toBe(true);
    },
  );

  it("rejects a phone under ten digits but allows an empty one", () => {
    expect(validateInquiry(form({ ...valid, phone: "call me" })).ok).toBe(false);
    expect(validateInquiry(form({ ...valid, phone: "555-0100" })).ok).toBe(false);
    expect(validateInquiry(form({ ...valid, phone: "" })).ok).toBe(true);
  });

  it("stores the phone in (xxx) xxx-xxxx ext:xxxxx format", () => {
    const plain = validateInquiry(form({ ...valid, phone: "555.010.0199" }));
    expect(plain.data.phone).toBe("(555) 010-0199");
    const ext = validateInquiry(form({ ...valid, phone: "555010019912" }));
    expect(ext.ok && ext.data.phone).toBe("(555) 010-0199 ext:12");
  });

  it("rejects messages that are too short or too long", () => {
    expect(validateInquiry(form({ ...valid, message: "hi" })).ok).toBe(false);
    expect(validateInquiry(form({ ...valid, message: "x".repeat(5001) })).ok).toBe(false);
  });
});
