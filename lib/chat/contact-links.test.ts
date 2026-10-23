import { describe, expect, it } from "vitest";

import { splitContactLinks } from "./contact-links";

describe("splitContactLinks", () => {
  it("replaces a contact URL, keeping surrounding punctuation", () => {
    expect(splitContactLinks("Please use the contact form: http://localhost:3000/contact.")).toEqual([
      { type: "text", text: "Please use the contact form: " },
      { type: "contact" },
      { type: "text", text: "." },
    ]);
  });

  it("handles a trailing slash, https, and several links", () => {
    expect(splitContactLinks("https://monip-group.com/contact/ or (https://x.com/contact)")).toEqual([
      { type: "contact" },
      { type: "text", text: " or (" },
      { type: "contact" },
      { type: "text", text: ")" },
    ]);
  });

  it("leaves other URLs and longer paths as text", () => {
    const text = "See http://localhost:3000/products and http://localhost:3000/contacts/x";
    expect(splitContactLinks(text)).toEqual([{ type: "text", text }]);
  });
});
