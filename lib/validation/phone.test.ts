import { describe, expect, it } from "vitest";

import { formatPhone } from "./phone";

describe("formatPhone", () => {
  it("formats progressively as digits are typed", () => {
    expect(formatPhone("")).toBe("");
    expect(formatPhone("5")).toBe("(5");
    expect(formatPhone("555")).toBe("(555");
    expect(formatPhone("5550")).toBe("(555) 0");
    expect(formatPhone("5550101")).toBe("(555) 010-1");
    expect(formatPhone("5550101234")).toBe("(555) 010-1234");
  });

  it("adds an extension past ten digits, up to five", () => {
    expect(formatPhone("55501012349")).toBe("(555) 010-1234 ext:9");
    expect(formatPhone("555010123412345678")).toBe("(555) 010-1234 ext:12345");
  });

  it("ignores non-digits and reformats existing values", () => {
    expect(formatPhone("555.010.1234")).toBe("(555) 010-1234");
    expect(formatPhone("(555) 010-1234 ext:12")).toBe("(555) 010-1234 ext:12");
  });
});
