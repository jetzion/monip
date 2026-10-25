import { describe, expect, it } from "vitest";

import { pickFreeVisionModels } from "./free-models";

const model = (id: string, input: string[], output = ["text"]) => ({
  id,
  architecture: { input_modalities: input, output_modalities: output },
});

describe("pickFreeVisionModels", () => {
  it("keeps free models that read images and write text", () => {
    expect(
      pickFreeVisionModels([
        model("google/gemma:free", ["text", "image"]),
        model("paid/vision", ["text", "image"]),
        model("text/only:free", ["text"]),
        model("nvidia/content-safety:free", ["text", "image"]),
        model("image/maker:free", ["text", "image"], ["image"]),
        { id: "no/architecture:free" },
      ]),
    ).toEqual(["google/gemma:free"]);
  });
});
