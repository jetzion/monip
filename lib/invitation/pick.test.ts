import { describe, expect, it, vi } from "vitest";

import { parsePick, pickPrompt, pickQuestion } from "./pick";

const questions = ["Need help finding a product?", "Questions about this product?", "Planning a big order?"];

describe("pickPrompt", () => {
  it("numbers the questions after the page", () => {
    expect(pickPrompt("Product: Mug", questions)).toContain("Page:\nProduct: Mug\n\nQuestions:\n1. Need help finding a product?\n2. Questions about this product?");
  });
});

describe("parsePick", () => {
  it("returns the numbered question", () => {
    expect(parsePick("2", questions)).toBe("Questions about this product?");
    expect(parsePick(" 3. Planning a big order?", questions)).toBe("Planning a big order?");
  });

  it("returns null for out-of-range or non-numeric replies", () => {
    expect(parsePick("0", questions)).toBeNull();
    expect(parsePick("4", questions)).toBeNull();
    expect(parsePick("The second one", questions)).toBeNull();
  });
});

describe("pickQuestion", () => {
  it("returns null without questions and skips the AI for one question", async () => {
    const ask = vi.fn();
    expect(await pickQuestion("Home", [], ask)).toBeNull();
    expect(await pickQuestion("Home", ["Only one?"], ask)).toBe("Only one?");
    expect(ask).not.toHaveBeenCalled();
  });

  it("uses the AI's choice", async () => {
    expect(await pickQuestion("Product: Mug", questions, async () => "2")).toBe("Questions about this product?");
  });

  it("falls back to the first question when the AI fails or replies badly", async () => {
    expect(await pickQuestion("Home", questions, async () => null)).toBe(questions[0]);
    expect(await pickQuestion("Home", questions, async () => "maybe")).toBe(questions[0]);
  });
});
