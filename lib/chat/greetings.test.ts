import { describe, expect, it } from "vitest";

import { GREETINGS, pickGreeting } from "./greetings";

describe("pickGreeting", () => {
  it("covers every greeting across the random range", () => {
    expect(pickGreeting(() => 0)).toBe(GREETINGS[0]);
    expect(pickGreeting(() => 0.999)).toBe(GREETINGS.at(-1));
  });

  it("has distinct greetings that all introduce David", () => {
    expect(new Set(GREETINGS).size).toBe(GREETINGS.length);
    for (const greeting of GREETINGS) expect(greeting).toContain("David");
  });
});
