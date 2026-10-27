import type { BeforeListTableServerProps } from "payload";

import { getSailingFilterOptions } from "@/lib/sailings/filter-options";
import { isTimesOnly } from "@/lib/sailings/times-only";

import { SailingFilterBar } from "./SailingFilterBar";

/** Loads dropdown options from the complete dataset for the Cruise Fleet Schedule filters. */
export async function SailingFilters({ payload, user }: BeforeListTableServerProps) {
  const [options, timesOnly] = await Promise.all([
    getSailingFilterOptions(payload, user ?? null),
    isTimesOnly(payload, user ?? null),
  ]);
  return <SailingFilterBar options={options} timesOnly={timesOnly} />;
}
