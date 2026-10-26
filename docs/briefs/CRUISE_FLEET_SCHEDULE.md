# Cruise Fleet Schedule Admin Page

## Decisions (2026-10-26)

These override the generic wording in the sections below.

- **Implementation:** a Payload collection (`cruise-sailings`) with a custom
  admin list view. Payload provides the table, migrations, authentication,
  server-side filtering, sorting, pagination, and the detail view, so the
  custom endpoints in 5.1–5.3 are not built separately.
- **Access:** admin role only. Sailings never appear on the public site, in
  search, the sitemap, or the AI chat (Operator data is commercially
  sensitive).
- **Editing:** admins may create, edit, and delete individual sailings in
  the Payload admin to add or clean data.
- **Import:** an **Import Excel** button on the admin page uploads a filled
  template (.xlsx, up to 4 MB) and shows the import summary; the CLI script
  (`pnpm import:sailings <file.xlsx>`) handles larger workbooks. The
  workbook is not committed.
- **Matching key:** Ship + Start date (unique across all 25,896 source rows).
- **Re-import:** matching records are updated, new ones inserted; records
  missing from the workbook are kept. Bulk search-select-delete of old
  records is a future feature.
- **Arrival / Departure:** the ship's times at the start port on
  embarkation day, stored as `HH:MM` text.
- **Date filter:** a date picker instead of a dropdown (1,108 distinct
  dates). Ship and Port dropdowns are searchable.
- **Ship dropdown:** once a cruise line is selected, lists only that line's
  ships; choosing a cruise line clears a selected ship from another line.
- **Dates shown:** all sailings, past and future.
- **Empty values:** Payload's default list placeholder (for example
  `<No Arrival>`) is acceptable instead of `—`.
- **Long text:** Ports in order and Source wrap in full in the list
  instead of being truncated.

## 1. Overview

Build a new **Cruise Fleet Schedule** admin page using the `Sailings` worksheet in the provided Excel workbook, `Cruise Fleet Calendar 2025-2027 WIP - Port Times Updated.xlsx`, as the source data.

The implementation must include:

- An admin UI for viewing, filtering, sorting, and navigating cruise sailings.
- A database table or equivalent persistence model for storing sailing records.
- Backend API endpoints for retrieving sailing data and filter options.
- An Excel import process to populate the database.
- Functionality to generate a blank Excel template that users can download and fill in with new data for import.
- Appropriate validation, error handling, and data integrity controls.

Before implementation, inspect the existing application architecture, database, authentication, routing, UI components, and API conventions. Follow the existing patterns and reuse components wherever practical. Do not introduce a new framework or database if the application already has an established solution.

## 2. Excel Source Data

### Source worksheet

Use the `Sailings` worksheet. The workbook also contains other worksheets, including `Port Times`, `Cruise Regions`, and annual calendar worksheets. These are not the primary source for populating this page.

The `Sailings` worksheet currently contains the following 13 columns:

1. Cruise line
2. Ship
3. Operator
4. Start date
5. End date
6. Nights
7. Start port
8. End port
9. Ports in order
10. Confidence
11. Source
12. Arrival
13. Departure

Use the actual worksheet name and column headers when implementing the import. Do not assume that the worksheet is named `Sailing`.

### Import requirements

- Read the header row to identify columns by name, not by fixed column position.
- Map the Excel columns to the corresponding database fields.
- Convert Excel date values into properly typed dates.
- Convert `Nights` to an integer where valid.
- Preserve text fields, including multi-port itinerary details and source information.
- Handle blank cells, null values, and inconsistent formatting without failing the entire import unnecessarily.
- Trim accidental leading and trailing whitespace from text fields without changing meaningful content.
- Report invalid rows and import errors with sufficient detail for troubleshooting.
- Provide an import summary containing the number of records processed, inserted, updated, skipped, and rejected.
- Make the import idempotent: importing the same dataset repeatedly must not create duplicate sailings.
- Preserve existing data when an import fails. Use a transaction or staging-and-validation approach where appropriate.

The initial import should load the sailing records from the worksheet. Subsequent imports update records matched by Ship + Start date, insert new records, and keep records that are missing from the workbook.

## 3. Database Design

Create a persistent database table named `cruise_sailings`, or use the existing project naming convention.

### Required fields

| Field | Suggested database type | Description |
|---|---|---|
| id | UUID or existing primary-key type | Unique record identifier |
| cruise_line | VARCHAR/TEXT | Cruise line name |
| ship | VARCHAR/TEXT | Ship name |
| operator | VARCHAR/TEXT | Ship operator |
| start_date | DATE | Sailing departure date |
| end_date | DATE | Sailing return/end date |
| nights | INTEGER | Number of nights |
| start_port | VARCHAR/TEXT | Port where the sailing begins |
| end_port | VARCHAR/TEXT | Port where the sailing ends |
| ports_in_order | TEXT or JSON | Ordered itinerary information |
| confidence | VARCHAR/TEXT or existing compatible type | Confidence value from the source |
| source | TEXT | Source reference or source description |
| arrival | Existing compatible type | Arrival information from the source |
| departure | Existing compatible type | Departure information from the source |
| created_at | TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | Last modification timestamp |

Use the simplest representation that preserves the source data correctly. Inspect actual values in `Ports in order`, `Confidence`, `Arrival`, and `Departure` before finalizing their types. Do not assume that `Confidence` is numeric or that arrival and departure values are always timestamps.

### Database constraints and indexes

- Use a primary key for every record.
- Add indexes for frequently filtered fields: `start_date`, `start_port`, `cruise_line`, `operator`, and `ship`.
- Add an index for `end_date` if it will be used in date-range filtering or sorting.
- Establish a stable duplicate-detection strategy based on the source data and available identifiers. Do not assume that ship, start date, and start port alone always identify a unique sailing.
- Allow nullable values when the source data legitimately lacks information.
- Avoid adding constraints that reject valid historical or incomplete source records without a documented business rule.

## 4. Admin Page UI

Create an admin page titled **Cruise Fleet Schedule**.

### 4.1 Sailing list

Display the complete sailing dataset in a responsive, readable table.

The table must include these columns in this order:

1. Cruise line
2. Ship
3. Operator
4. Start date
5. End date
6. Nights
7. Start port
8. End port
9. Ports in order
10. Confidence
11. Source
12. Arrival
13. Departure

Requirements:

- Display dates consistently using the application's established date format.
- Display missing values as a neutral placeholder, such as `—`, rather than `null`, `undefined`, or misleading default values.
- Show long itinerary and source values without breaking the table layout. Use truncation with a way to inspect the full value, such as a tooltip, expandable detail view, or record details panel.
- Keep the header readable when scrolling through a long list.
- Provide pagination with a configurable page size, using a reasonable default such as 25 records per page.
- Display the total number of matching records and the current page information.
- Preserve active filters and sorting when navigating between pages.
- Include loading, empty, and error states.
- Provide a clear indication when no records match the selected filters.
- Ensure the page is usable on desktop and tablet screens. Use horizontal scrolling or an equivalent responsive pattern for the wide table.

### 4.2 Filters

Place the filters prominently above the table.

Implement the following six dropdown filters:

**A. Port**

- Populate options from distinct, non-empty values in `start_port` across the complete sailing dataset.
- Use the label `Port`.
- Selecting a port filters records by exact `start_port` match.
- Do not include `end_port` values unless the requirements are explicitly expanded to include destination-port filtering.

**B. Month**

- Populate options from the distinct month/year combinations present in `start_date` across the complete dataset.
- Display options chronologically, for example, `October 2026`.
- Selecting a month filters records whose start date falls within that calendar month and year.

**C. Date**

- Use a date picker, not a dropdown (the dataset has over 1,000 distinct start dates).
- Display dates in the application's standard date format.
- Selecting a date filters records to that exact start date.

**D. Cruise line**

- Populate options from distinct, non-empty `cruise_line` values across the complete dataset.
- Sort options alphabetically.
- Filter by exact cruise line match.

**E. Operator**

- Populate options from distinct, non-empty `operator` values across the complete dataset.
- Sort options alphabetically.
- Filter by exact operator match.

**F. Ship**

- Populate options from distinct, non-empty `ship` values across the complete dataset.
- Sort options alphabetically.
- Filter by exact ship match.

### 4.3 Filter behavior

- All six filters must work independently and in combination.
- When multiple filters are selected, apply **AND logic**. A record must satisfy every active filter.
- All dropdown options must be derived from the complete dataset, not just the currently displayed page or filtered results. This prevents options from disappearing unexpectedly when filters are applied. Exception: the Ship dropdown narrows to the selected cruise line.
- Include an `All` or equivalent unselected option for each dropdown.
- Provide a `Clear filters` action that resets every filter and returns the user to the unfiltered list.
- Reset pagination to the first page whenever a filter changes.
- Update the results and record count when a filter is selected or cleared.
- Do not require a separate Search button unless consistent with the existing application design.
- Ensure that selecting Month and Date together returns records matching both the chosen month and the chosen date.
- Handle missing values consistently and exclude empty values from dropdown options.

### 4.4 Sorting

Support sorting by clicking sortable column headers.

At minimum, support sorting by:

- Cruise line
- Ship
- Operator
- Start date
- End date
- Nights
- Start port
- End port

Requirements:

- Toggle between ascending and descending order.
- Show a visible sort indicator on the active column.
- Use actual date and numeric comparisons for dates and nights, not string comparisons.
- Define a consistent default sort order, preferably `Start date` ascending, followed by `Cruise line` and `Ship`.
- Preserve sorting when filters change.

### 4.5 Record details

Provide a way to inspect a complete sailing record when the table cannot display all field contents conveniently.

A details panel, modal, or dedicated detail page may be used, consistent with the existing UI.

The details view must display all 13 fields without silently truncating the underlying values.

The initial release requires viewing, filtering, sorting, and pagination. Admins may also create, edit, and delete individual records through the Payload admin.

## 5. Backend API Endpoints

Implement endpoints following the application's existing routing and response conventions. The paths below are proposed examples; adapt them to the current architecture. Per the decisions above, Payload's collection API covers 5.1–5.3, and 5.4 is a CLI script in v1.

### 5.1 List sailings

`GET /api/admin/cruise-sailings`

Support the following query parameters:

- `port`: exact start port
- `month`: month and year, preferably `YYYY-MM`
- `date`: exact start date, formatted `YYYY-MM-DD`
- `cruiseLine`: cruise line
- `operator`: operator
- `ship`: ship
- `page`: page number
- `pageSize`: number of records per page
- `sortBy`: permitted sortable field
- `sortOrder`: `asc` or `desc`

The endpoint must:

- Apply all active filters using AND logic.
- Validate pagination and sorting parameters.
- Use parameterized queries or the application's ORM to prevent SQL injection.
- Apply pagination and sorting on the server for large datasets.
- Return the current page of records and the total number of matching records.
- Return consistent error responses for invalid parameters or database errors.

Suggested response structure:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 25,
    "totalRecords": 0,
    "totalPages": 0
  }
}
```

### 5.2 Retrieve filter options

`GET /api/admin/cruise-sailings/filters`

Return distinct filter options derived from the complete dataset.

Suggested response structure:

```json
{
  "ports": [],
  "months": [],
  "dates": [],
  "cruiseLines": [],
  "operators": [],
  "ships": []
}
```

Requirements:

- Exclude null and empty values.
- Return dates in a consistent machine-readable format.
- Return months in `YYYY-MM` format with display labels such as `October 2026`, or use a consistent equivalent structure.
- Return options in a stable, documented order.
- Avoid calculating filter options from the current page of sailing results.
- Consider caching the results if appropriate, with a defined invalidation strategy after imports or data updates.

### 5.3 Retrieve a single sailing

`GET /api/admin/cruise-sailings/:id`

Return the full record for the selected sailing.

- Return `404` if the record does not exist.
- Validate the record identifier.
- Apply the application's standard authorization rules.

### 5.4 Import sailings

If the application needs to support future workbook uploads, provide an authenticated import endpoint, for example:

`POST /api/admin/cruise-sailings/import`

Requirements:

- Validate the uploaded file type and structure.
- Verify the presence of the required worksheet and column headers.
- Validate and normalize records before committing changes.
- Prevent duplicate records.
- Return an import summary and row-level validation errors.
- Apply appropriate upload-size limits and access controls.

If workbook uploads are outside the scope of the initial UI, provide a documented server-side import script or migration process instead. Do not build an upload interface solely because an import endpoint is defined here.

### 5.5 Download blank Excel template

Provide a way for an authorized admin user to download a blank Excel template for adding sailing data.

Suggested endpoint:

`GET /api/admin/cruise-sailings/template`

Requirements:

- Generate an `.xlsx` file with a `Sailings` worksheet.
- Include the 13 required column headers in the expected order.
- Include no sailing data rows.
- Use clear, consistent header names that match the importer's expected column mapping.
- Optionally include basic Excel formatting and data validation where it improves data entry.
- Ensure the downloaded template can be populated and re-imported without manually changing its column names.
- Protect the endpoint using the application's existing admin authorization.

Add a **Download Excel Template** action to the admin page near the import controls.

## 6. Authentication and Authorization

- Place the page within the existing admin navigation and routing structure.
- Require the same authentication and authorization protections used by other admin pages.
- Protect all admin API endpoints, including filter options, record details, template downloads, and import operations.
- Do not rely on hiding the UI to enforce authorization.
- Follow existing logging and error-reporting conventions.
- Do not expose credentials, database details, or internal stack traces to the client.

## 7. Performance and Data Integrity

- Perform filtering, sorting, pagination, and total-count calculation efficiently on the server.
- Avoid loading the entire dataset into the browser solely to implement pagination.
- Retrieve dropdown options efficiently using distinct queries or an equivalent optimized strategy.
- Ensure pagination uses a stable sort order so records do not jump unpredictably between pages.
- Handle empty datasets and partially populated records gracefully.
- Use consistent date handling and avoid timezone shifts when importing date-only Excel values.
- Keep the source values intact when normalizing data for display.
- Ensure the UI refreshes appropriately after an import or other data update.
- Do not silently discard records that fail validation. Include them in an import report.

## 8. Testing and Acceptance Criteria

The implementation is complete when all of the following conditions are satisfied.

### Data import and template

- [ ] The importer reads the `Sailings` worksheet using column headers.
- [ ] All 13 source fields are mapped to the correct database fields.
- [ ] Valid dates and numeric nights are stored correctly.
- [ ] Missing values and malformed records are handled and reported.
- [ ] Reimporting the same workbook does not create duplicate records.
- [ ] An unsuccessful import does not leave the database partially updated.
- [ ] The blank Excel template downloads successfully and contains all 13 required headers.
- [ ] A completed template can be imported without renaming its worksheet or columns.

### Admin page

- [ ] The page displays all 13 required columns.
- [ ] All sailing records can be browsed using pagination.
- [ ] Long itinerary and source values remain accessible in full.
- [ ] Sorting works correctly for supported columns.
- [ ] Loading, empty, and error states are handled.
- [ ] The full record can be inspected through the details view.
- [ ] The Download Excel Template action is visible and works for authorized users.

### Filters

- [ ] All five dropdowns contain distinct values from the complete dataset.
- [ ] Month options include the year and are ordered chronologically.
- [ ] The Date picker filters by exact start date.
- [ ] Every filter works independently.
- [ ] Multiple filters work together using AND logic.
- [ ] Filter options remain available when other filters are selected.
- [ ] Clear filters resets the entire filter state.
- [ ] The results count and pagination update correctly after filtering.

### API and security

- [ ] Endpoints validate incoming parameters.
- [ ] Filtering and pagination execute on the server.
- [ ] SQL injection protections are in place.
- [ ] Admin authentication and authorization are enforced.
- [ ] Missing records and invalid requests return appropriate error responses.
- [ ] Template downloads and imports are protected by authorization.

### Verification

- [ ] Unit tests cover filtering, date handling, sorting, and import validation.
- [ ] Integration tests verify the database queries and API responses.
- [ ] UI tests verify the filters, pagination, sorting, and empty states.
- [ ] The implementation is tested against representative records from the provided workbook.
- [ ] Existing application functionality remains unaffected.

## 9. Implementation Deliverables

Claude Code must:

1. Inspect the existing project and document the relevant architecture and conventions.
2. Finalize the database schema and any required migration.
3. Implement the Excel import process and load the initial data.
4. Implement the blank Excel template generation and download.
5. Implement the backend endpoints.
6. Build the Cruise Fleet Schedule admin page and integrate it into admin navigation.
7. Implement all six filters, sorting, pagination, and the record details view.
8. Add automated tests and run the relevant test suite.
9. Document how to run migrations, perform the initial import, download the template, and reimport updated workbooks.
10. Report the files created or modified, any assumptions made, test results, and any remaining limitations.

Do not fabricate missing source values or infer unprovided cruise itinerary details. Preserve the source data and make any data-quality limitations visible where appropriate.

## 10. Scope Boundaries and Assumptions

- The `Sailings` worksheet is the authoritative source for this page's initial dataset.
- The `Port Times` worksheet is not a replacement for the sailing records. Its arrival and departure data should not be joined or substituted unless a separate requirement explicitly calls for that behavior.
- The `Arrival` and `Departure` columns must be mapped directly from the `Sailings` worksheet. Do not reinterpret them as the sailing's start or end dates without validating the source semantics.
- The `Port` filter means **Start port**, not any port visited during the itinerary.
- The first version is a read-oriented admin page with a controlled data-import process. Individual records can be created, edited, and deleted in the Payload admin; inline table editing and bulk deletion are out of scope.
- Use the existing application's technology stack, styling conventions, and security model.
- Where a requirement conflicts with the actual workbook structure or existing application constraints, document the conflict and resolve it explicitly rather than silently guessing.
