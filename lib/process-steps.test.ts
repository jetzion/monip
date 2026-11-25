import { describe, expect, it } from "vitest";

import type { Service } from "@/payload-types";

import { processCards, serviceId } from "./process-steps";

const service = (id: number) => ({ id, slug: `s${id}`, image: null }) as Pick<Service, "id" | "slug" | "image">;
const step = (id: number, title: string) => ({ service: id, title, description: `${title} text` });

describe("processCards", () => {
  it("keeps the step order and uses the step title", () => {
    const cards = processCards([step(3, "C"), step(1, "A"), step(2, "B")], [service(1), service(2), service(3)]);
    expect(cards.map((card) => [card.title, card.service.slug])).toEqual([
      ["C", "s3"],
      ["A", "s1"],
      ["B", "s2"],
    ]);
  });

  it("leaves out steps whose service is not available (unpublished or deleted)", () => {
    expect(processCards([step(1, "A"), step(9, "Hidden")], [service(1)]).map((card) => card.title)).toEqual(["A"]);
  });

  it("returns no cards without steps", () => {
    expect(processCards(null, [service(1)])).toEqual([]);
  });
});

describe("serviceId", () => {
  it("reads an ID or a populated service", () => {
    expect(serviceId(4)).toBe(4);
    expect(serviceId({ id: 5 } as Service)).toBe(5);
  });
});
