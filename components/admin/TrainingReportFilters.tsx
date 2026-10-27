"use client";

import { ReactSelect } from "@payloadcms/ui";
import { useRouter } from "next/navigation";

type Option = { label: string; value: string };
type Key = "trainer" | "from" | "to" | "group";
type Field = { key: Key; label: string; options: Option[]; value: string; clearable?: boolean };

/**
 * Trainer, From, To, and Group by choices for the training report, stored in
 * the URL. Current values come from the server render.
 */
export function TrainingReportFilters({ fields }: { fields: Field[] }) {
  const router = useRouter();

  const apply = (key: Key, value: string | undefined) => {
    const params = new URLSearchParams(window.location.search);
    for (const field of fields) if (!params.has(field.key) && field.value) params.set(field.key, field.value);
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${window.location.pathname}?${params}`);
  };

  return (
    <div className="training-calendar__filters" role="group" aria-label="Report options">
      {fields.map((field) => (
        <div className="training-form__field" key={field.key}>
          <label htmlFor={`training-report-${field.key}`}>{field.label}</label>
          {/* react-select keeps its own selection when value is undefined; remount so it shows the URL's choice. */}
          <ReactSelect
            key={field.value}
            inputId={`training-report-${field.key}`}
            isClearable={Boolean(field.clearable)}
            isSearchable
            placeholder="All trainers"
            options={field.options}
            value={field.options.find((option) => option.value === field.value)}
            onChange={(option) => apply(field.key, Array.isArray(option) ? undefined : (option?.value as string | undefined))}
          />
        </div>
      ))}
    </div>
  );
}
