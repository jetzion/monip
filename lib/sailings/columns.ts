/** Name of the worksheet that holds sailings, in imports and the template. */
export const SAILINGS_SHEET = "Sailings";

/** Workbook column headers, in order, mapped to collection field names. */
export const SAILING_COLUMNS = [
  { header: "Cruise line", field: "cruiseLine" },
  { header: "Ship", field: "ship" },
  { header: "Operator", field: "operator" },
  { header: "Start date", field: "startDate" },
  { header: "End date", field: "endDate" },
  { header: "Nights", field: "nights" },
  { header: "Start port", field: "startPort" },
  { header: "End port", field: "endPort" },
  { header: "Ports in order", field: "portsInOrder" },
  { header: "Confidence", field: "confidence" },
  { header: "Source", field: "source" },
  { header: "Arrival", field: "arrival" },
  { header: "Departure", field: "departure" },
] as const;

export type SailingField = (typeof SAILING_COLUMNS)[number]["field"];
