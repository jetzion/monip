import { describe, expect, it } from "vitest";

import { AVATAR_COLORS, avatarColor, initialsOf } from "./initials";

/** WCAG contrast ratio of a "#rrggbb" colour against white. */
function contrastWithWhite(hex: string): number {
  const channel = (index: number) => {
    const value = parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
  return 1.05 / (luminance + 0.05);
}

describe("initialsOf", () => {
  it("uses the first letters of First name and Last name", () => {
    expect(initialsOf("Jack", "Etzion", "x@y.com")).toBe("JE");
    expect(initialsOf(" maria ", "de la Cruz")).toBe("MD");
    expect(initialsOf("Mary Ann", "Smith")).toBe("MS");
  });

  it("uses two letters of the only name given", () => {
    expect(initialsOf("Nicola", null)).toBe("NI");
    expect(initialsOf("", "Lee")).toBe("LE");
  });

  it("falls back to the email, then a question mark", () => {
    expect(initialsOf(null, null, "declan.smith@example.com")).toBe("DE");
    expect(initialsOf("", "", "")).toBe("?");
  });
});

describe("avatarColor", () => {
  it("gives the same user the same colour, and users different colours", () => {
    expect(avatarColor(7)).toBe(avatarColor("7"));
    const colours = new Set([1, 2, 3, 4, 5, 6].map(avatarColor));
    expect(colours.size).toBeGreaterThan(4);
  });

  it("keeps white initials readable on every colour", () => {
    for (const colour of AVATAR_COLORS) expect(contrastWithWhite(colour), colour).toBeGreaterThanOrEqual(4.5);
  });
});
