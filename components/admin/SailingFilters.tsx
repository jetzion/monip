import type { BeforeListTableServerProps } from "payload";

import { getSailingFilterOptions } from "@/lib/sailings/filter-options";

import { SailingFilterBar } from "./SailingFilterBar";

/** Loads dropdown options from the complete dataset for the Cruise Fleet Schedule filters. */
export async function SailingFilters({ payload, user }: BeforeListTableServerProps) {
  const options = await getSailingFilterOptions(payload, user ?? null);
  return <SailingFilterBar options={options} />;
}
