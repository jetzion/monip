import { sql } from "@payloadcms/db-postgres";
import type { Payload } from "payload";

import type { CruiseCombo } from "./cruise-choice";

/**
 * Distinct cruise line, ship, and start port combinations of sailings starting
 * on or after a day (about 600 rows, against 10,000+ sailings). One SQL query,
 * since findDistinct handles a single field. Bypasses access control: callers
 * must already have checked the user is an admin.
 */
export async function upcomingCruiseCombos(payload: Payload, fromDay: string): Promise<CruiseCombo[]> {
  const { rows } = await payload.db.drizzle.execute<{ cruise_line: string; ship: string; start_port: string }>(sql`
    select distinct cruise_line, ship, start_port
    from cruise_sailings
    where start_date >= ${fromDay}::date and coalesce(start_port, '') <> ''
    order by cruise_line, ship, start_port
  `);
  return rows.map((row) => ({ cruiseLine: row.cruise_line, ship: row.ship, port: row.start_port }));
}
