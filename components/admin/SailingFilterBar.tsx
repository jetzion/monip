"use client";

import { Button, DatePicker, ReactSelect, useListQuery } from "@payloadcms/ui";

import type { SailingFilterOptions } from "@/lib/sailings/filter-options";
import { changeFilter, filtersToWhere, shipsFor, whereToFilters, type SailingFilters } from "@/lib/sailings/filters";

type Option = { label: string; value: string };

const toOptions = (values: string[]): Option[] => values.map((value) => ({ label: value, value }));

/**
 * Port, Month, Date, Cruise line, Operator, and Ship filters above the
 * sailings table. The Ship list narrows to the selected cruise line.
 * Selections combine with AND and are stored in the list's
 * URL query, so pagination, sorting, and the record count follow them.
 */
export function SailingFilterBar({ options }: { options: SailingFilterOptions }) {
  const { query, handleWhereChange } = useListQuery();
  const filters = whereToFilters(query.where);

  const update = (key: keyof SailingFilters, value: string | undefined) =>
    handleWhereChange?.(filtersToWhere(changeFilter(filters, key, value, options.shipsByCruiseLine)));

  const dropdowns: { key: keyof SailingFilters; label: string; options: Option[] }[] = [
    { key: "port", label: "Port", options: toOptions(options.ports) },
    { key: "month", label: "Month", options: options.months },
    { key: "cruiseLine", label: "Cruise line", options: toOptions(options.cruiseLines) },
    { key: "operator", label: "Operator", options: toOptions(options.operators) },
    { key: "ship", label: "Ship", options: toOptions(shipsFor(filters.cruiseLine, options)) },
  ];

  return (
    <div className="sailing-filters" role="group" aria-label="Filter sailings">
      {dropdowns.slice(0, 2).map((dropdown) => (
        <Dropdown key={dropdown.key} filterKey={dropdown.key} label={dropdown.label} options={dropdown.options} value={filters[dropdown.key]} onChange={update} />
      ))}
      <div className="sailing-filters__field">
        <label htmlFor="sailing-filter-date">Date</label>
        {/* DatePicker's own id goes on a wrapper; overrides sets the input's id. */}
        <DatePicker
          overrides={{ id: "sailing-filter-date" }}
          pickerAppearance="dayOnly"
          displayFormat="d MMM yyyy"
          placeholder="All"
          value={filters.date ? `${filters.date}T12:00:00.000Z` : undefined}
          onChange={(date) => update("date", date ? date.toISOString().slice(0, 10) : undefined)}
        />
      </div>
      {dropdowns.slice(2).map((dropdown) => (
        <Dropdown key={dropdown.key} filterKey={dropdown.key} label={dropdown.label} options={dropdown.options} value={filters[dropdown.key]} onChange={update} />
      ))}
      <Button
        buttonStyle="secondary"
        size="medium"
        disabled={Object.keys(filters).length === 0}
        onClick={() => handleWhereChange?.({})}
      >
        Clear filters
      </Button>
    </div>
  );
}

type DropdownProps = {
  filterKey: keyof SailingFilters;
  label: string;
  options: Option[];
  value: string | undefined;
  onChange: (key: keyof SailingFilters, value: string | undefined) => void;
};

function Dropdown({ filterKey, label, options, value, onChange }: DropdownProps) {
  const id = `sailing-filter-${filterKey}`;
  return (
    <div className="sailing-filters__field">
      <label htmlFor={id}>{label}</label>
      {/* react-select keeps its own selection when value is undefined; remount so it shows the filter. */}
      <ReactSelect
        key={value ?? ""}
        inputId={id}
        isClearable
        isSearchable
        placeholder="All"
        options={options}
        value={options.find((option) => option.value === value)}
        onChange={(option) => onChange(filterKey, Array.isArray(option) ? undefined : (option?.value as string))}
      />
    </div>
  );
}
