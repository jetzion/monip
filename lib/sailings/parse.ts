import { SAILING_COLUMNS, type SailingField } from "./columns";

/** A validated sailing, ready to save. Dates are ISO strings at 12:00 UTC. */
export type SailingInput = {
  cruiseLine: string;
  ship: string;
  operator: string | null;
  startDate: string;
  endDate: string | null;
  nights: number | null;
  startPort: string | null;
  endPort: string | null;
  portsInOrder: string | null;
  confidence: string | null;
  source: string | null;
  arrival: string | null;
  departure: string | null;
};

export type RejectedRow = { row: number; reason: string };

export type ParseResult = { sailings: SailingInput[]; rejected: RejectedRow[] };

/** Unwraps exceljs hyperlink, rich text, and formula cells to a plain value. */
export const cellValue = (value: unknown): unknown => {
  if (value === null || typeof value !== "object" || value instanceof Date) return value;
  if ("richText" in value) return (value.richText as { text: string }[]).map((part) => part.text).join("");
  if ("result" in value) return cellValue(value.result);
  if ("text" in value) return cellValue(value.text);
  return null;
};

const text = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed === "" ? null : trimmed;
};

/**
 * Converts an Excel date (exceljs gives UTC midnight) or YYYY-MM-DD text to
 * an ISO string at 12:00 UTC, matching Payload's day-only date picker.
 */
export const toDay = (value: unknown): string | null | "invalid" => {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "invalid";
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(), 12)).toISOString();
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value).trim());
  if (!match) return "invalid";
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12));
  return date.getUTCDate() === Number(match[3]) ? date.toISOString() : "invalid";
};

/** Keeps HH:MM text as is; Excel time cells (dates on 1899-12-30) become HH:MM. */
const toTime = (value: unknown): string | null =>
  value instanceof Date ? value.toISOString().slice(11, 16) : text(value);

const toNights = (value: unknown): number | null | "invalid" => {
  const raw = text(value);
  if (raw === null) return null;
  const nights = Number(raw);
  return Number.isInteger(nights) && nights >= 0 ? nights : "invalid";
};

/** Maps each field to its column index; throws if a header is missing. */
const columnIndexes = (header: unknown[]): Record<SailingField, number> => {
  const names = header.map((cell) => text(cellValue(cell)));
  const missing = SAILING_COLUMNS.filter((column) => !names.includes(column.header));
  if (missing.length > 0) {
    throw new Error(`Missing columns: ${missing.map((column) => column.header).join(", ")}`);
  }
  return Object.fromEntries(
    SAILING_COLUMNS.map((column) => [column.field, names.indexOf(column.header)]),
  ) as Record<SailingField, number>;
};

const parseRow = (get: (field: SailingField) => unknown): SailingInput | string => {
  const cruiseLine = text(get("cruiseLine"));
  const ship = text(get("ship"));
  const startDate = toDay(get("startDate"));
  const endDate = toDay(get("endDate"));
  const nights = toNights(get("nights"));
  if (!cruiseLine) return "Cruise line is empty";
  if (!ship) return "Ship is empty";
  if (!startDate) return "Start date is empty";
  if (startDate === "invalid") return "Start date is not a valid date";
  if (endDate === "invalid") return "End date is not a valid date";
  if (nights === "invalid") return "Nights is not a whole number";
  return {
    cruiseLine,
    ship,
    operator: text(get("operator")),
    startDate,
    endDate,
    nights,
    startPort: text(get("startPort")),
    endPort: text(get("endPort")),
    portsInOrder: text(get("portsInOrder")),
    confidence: text(get("confidence")),
    source: text(get("source")),
    arrival: toTime(get("arrival")),
    departure: toTime(get("departure")),
  };
};

/** Identifies a sailing: Ship + Start date. */
export const sailingKey = (sailing: { ship: string; startDate: string }) =>
  `${sailing.ship}|${sailing.startDate.slice(0, 10)}`;

/**
 * Parses worksheet rows (first row = headers, columns found by name).
 * Blank rows are ignored; invalid rows and repeated Ship + Start date rows
 * are rejected with their worksheet row number.
 */
export const parseSailingRows = (rows: unknown[][]): ParseResult => {
  const [header = [], ...data] = rows;
  const index = columnIndexes(header);
  const sailings: SailingInput[] = [];
  const rejected: RejectedRow[] = [];
  const seen = new Map<string, number>();

  data.forEach((cells, i) => {
    const row = i + 2;
    const values = cells.map(cellValue);
    if (values.every((value) => text(value) === null)) return;
    const result = parseRow((field) => values[index[field]]);
    if (typeof result === "string") {
      rejected.push({ row, reason: result });
      return;
    }
    const key = sailingKey(result);
    const firstRow = seen.get(key);
    if (firstRow) {
      rejected.push({ row, reason: `Same ship and start date as row ${firstRow}` });
      return;
    }
    seen.set(key, row);
    sailings.push(result);
  });

  return { sailings, rejected };
};
