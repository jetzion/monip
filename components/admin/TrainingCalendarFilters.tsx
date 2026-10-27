"use client";

import { Button, ReactSelect } from "@payloadcms/ui";
import { useRouter } from "next/navigation";

type Option = { label: string; value: string };
type FilterKey = "calTrainer" | "calCruise" | "calType";
type Filter = { key: FilterKey; label: string; options: Option[]; value?: string };

/**
 * Trainer, Cruise, and Training type filters for the calendar, stored in the
 * URL. Current values come from the server render, like the calendar itself.
 */
export function TrainingCalendarFilters({ filters }: { filters: Filter[] }) {
  const router = useRouter();

  const apply = (changes: Partial<Record<FilterKey, string | undefined>>) => {
    const params = new URLSearchParams(window.location.search);
    params.delete("calSession");
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`${window.location.pathname}?${params}`);
  };

  return (
    <div className="training-calendar__filters" role="group" aria-label="Filter training sessions">
      {filters.map((filter) => (
        <div className="training-form__field" key={filter.key}>
          <label htmlFor={`training-filter-${filter.key}`}>{filter.label}</label>
          {/* react-select keeps its own selection when value is undefined; remount so it shows the filter. */}
          <ReactSelect
            key={filter.value ?? ""}
            inputId={`training-filter-${filter.key}`}
            isClearable
            isSearchable
            placeholder="All"
            options={filter.options}
            value={filter.options.find((option) => option.value === filter.value)}
            onChange={(option) => apply({ [filter.key]: Array.isArray(option) ? undefined : (option?.value as string | undefined) })}
          />
        </div>
      ))}
      <Button
        buttonStyle="secondary"
        size="medium"
        disabled={!filters.some((filter) => filter.value)}
        onClick={() => apply({ calTrainer: undefined, calCruise: undefined, calType: undefined })}
      >
        Clear filters
      </Button>
    </div>
  );
}
