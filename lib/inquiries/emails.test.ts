import { describe, expect, it } from "vitest";

import { autoReplyEmail, notificationEmail } from "./emails";

const inquiry = {
  name: "Alex Buyer",
  email: "alex@example.com",
  company: "",
  phone: "",
  message: "We need 500 units.",
};

describe("notificationEmail", () => {
  it("references the product name and URL", () => {
    const email = notificationEmail(inquiry, {
      name: "Steel Mug",
      url: "https://example.com/products/steel-mug",
    });
    expect(email.subject).toBe("New product inquiry: Steel Mug");
    expect(email.text).toContain("https://example.com/products/steel-mug");
    expect(email.text).toContain("We need 500 units.");
  });

  it("omits empty optional fields without leaving blank lines", () => {
    const email = notificationEmail(inquiry, null);
    expect(email.subject).toBe("New website inquiry");
    expect(email.text).toBe("Name: Alex Buyer\nEmail: alex@example.com\n\nWe need 500 units.");
  });

  it("includes optional fields when present", () => {
    const email = notificationEmail({ ...inquiry, company: "Acme", phone: "555-0100" }, null);
    expect(email.text).toContain("Company: Acme\nPhone: 555-0100");
  });
});

describe("autoReplyEmail", () => {
  it("is fixed text", () => {
    expect(autoReplyEmail()).toEqual(autoReplyEmail());
  });
});
