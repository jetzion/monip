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

  it("rejects an invalid email", () => {
    const result = validateInquiry(form({ ...valid, email: "not-an-email" }));
    expect(result.ok === false && result.errors.email).toBeTruthy();
  });

  it("rejects an invalid phone but allows an empty one", () => {
    expect(validateInquiry(form({ ...valid, phone: "call me" })).ok).toBe(false);
    expect(validateInquiry(form({ ...valid, phone: "+1 (555) 010-0199" })).ok).toBe(true);
  });

  it("rejects messages that are too short or too long", () => {
    expect(validateInquiry(form({ ...valid, message: "hi" })).ok).toBe(false);
    expect(validateInquiry(form({ ...valid, message: "x".repeat(5001) })).ok).toBe(false);
  });
});
