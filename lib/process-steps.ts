import type { Home, Service } from "@/payload-types";

type Step = NonNullable<NonNullable<Home["process"]>["steps"]>[number];
type CardService = Pick<Service, "id" | "slug" | "image">;

export type ProcessCard = { title: string; description: string; service: CardService };

/** Pairs each step with its service, in step order; steps whose service is not available are left out. */
export function processCards(steps: Step[] | null | undefined, services: CardService[]): ProcessCard[] {
  const byId = new Map(services.map((service) => [service.id, service]));
  return (steps ?? []).flatMap((step) => {
    const service = byId.get(serviceId(step.service));
    return service ? [{ title: step.title, description: step.description, service }] : [];
  });
}

/** The service ID of a step, whether or not the relationship is populated. */
export function serviceId(value: Step["service"]): number {
  return typeof value === "number" ? value : value.id;
}
