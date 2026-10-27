import { describe, expect, it } from "vitest";

import {
  buildReport,
  monthOptions,
  overlaps,
  rangeLabel,
  readReportParams,
  reportQuery,
  reportQueryRange,
  reportRow,
  totalsLabel,
  totalsOf,
  type ReportParams,
  type ReportSession,
} from "./report";

const session = (overrides: Partial<ReportSession>): ReportSession => ({
  id: 1,
  type: "departureDay",
  startsAt: "2026-10-03T12:00:00.000Z",
  endsAt: "2026-10-03T20:00:00.000Z",
  timeZone: "America/New_York",
  trainerId: 1,
  trainer: "Ann Lee",
  cruiseCopy: {
    ship: "Wonder",
    cruiseLine: "Royal Caribbean",
    startDate: "2026-10-03T12:00:00.000Z",
    endDate: "2026-10-10T12:00:00.000Z",
    startPort: "Miami",
  },
  ...overrides,
});

const october: ReportParams = { from: "2026-10", to: "2026-10", group: "trainer" };

describe("readReportParams", () => {
  it("defaults to this month, all trainers, grouped by trainer", () => {
    expect(readReportParams({}, "2026-10-27")).toEqual({ trainer: undefined, from: "2026-10", to: "2026-10", group: "trainer" });
  });

  it("reads a trainer, months, and the date layout", () => {
    expect(readReportParams({ trainer: "4", from: "2026-11", to: "2027-02", group: "date" }, "2026-10-27")).toEqual({
      trainer: "4",
      from: "2026-11",
      to: "2027-02",
      group: "date",
    });
  });

  it("refuses an end month before the start month", () => {
    expect(readReportParams({ from: "2026-11", to: "2026-10" }, "2026-10-27")).toEqual({
      error: "The end month must be the same as or after the start month.",
    });
  });

  it("refuses malformed months and trainers", () => {
    expect(readReportParams({ from: "2026-13" }, "2026-10-27")).toHaveProperty("error");
    expect(readReportParams({ trainer: "x" }, "2026-10-27")).toHaveProperty("error");
  });
});

describe("reportQuery", () => {
  it("round-trips through readReportParams", () => {
    const params: ReportParams = { trainer: "7", from: "2026-01", to: "2026-03", group: "date" };
    const query = Object.fromEntries(new URLSearchParams(reportQuery(params)));
    expect(readReportParams(query, "2026-10-27")).toEqual(params);
  });
});

describe("reportQueryRange", () => {
  it("widens the months by a day on each side", () => {
    expect(reportQueryRange({ from: "2026-10", to: "2026-12", group: "trainer" })).toEqual({
      from: "2026-09-30T00:00:00.000Z",
      to: "2027-01-02T00:00:00.000Z",
    });
  });
});

describe("overlaps", () => {
  it("uses the session's own time zone", () => {
    // 1 Nov 02:00 UTC is still 31 Oct in New York.
    const lateEvening = session({ startsAt: "2026-10-31T23:00:00.000Z", endsAt: "2026-11-01T02:00:00.000Z" });
    expect(overlaps(lateEvening, october)).toBe(true);
    expect(overlaps(lateEvening, { ...october, from: "2026-11", to: "2026-11" })).toBe(false);
  });

  it("keeps onboarding that only partly falls in the months", () => {
    const onboarding = session({ type: "onboarding", startsAt: "2026-09-28T04:00:00.000Z", endsAt: "2026-10-02T04:00:00.000Z" });
    expect(overlaps(onboarding, october)).toBe(true);
  });
});

describe("reportRow", () => {
  it("shows times in the session's time zone", () => {
    expect(reportRow(session({}))).toEqual({
      id: 1,
      dates: "3 Oct 2026",
      time: "08:00 – 16:00",
      timeZone: "America/New_York",
      type: "Departure day training",
      trainer: "Ann Lee",
      cruiseLine: "Royal Caribbean",
      ship: "Wonder",
      startPort: "Miami",
      cruiseDates: "3 Oct 2026 – 10 Oct 2026",
    });
  });

  it("shows onboarding as whole days", () => {
    const row = reportRow(session({ type: "onboarding", startsAt: "2026-10-03T04:00:00.000Z", endsAt: "2026-10-11T04:00:00.000Z" }));
    expect(row.dates).toBe("3 Oct 2026 – 10 Oct 2026");
    expect(row.time).toBe("All day");
  });

  it("marks missing cruise details", () => {
    const row = reportRow(session({ type: "online", cruiseCopy: null }));
    expect([row.cruiseLine, row.ship, row.startPort, row.cruiseDates]).toEqual(["—", "—", "—", "—"]);
  });
});

describe("totals", () => {
  it("adds hours of timed sessions and days of onboarding", () => {
    const totals = totalsOf([
      session({}),
      session({ type: "online", startsAt: "2026-10-05T13:00:00.000Z", endsAt: "2026-10-05T15:00:00.000Z" }),
      session({ type: "onboarding", startsAt: "2026-10-03T04:00:00.000Z", endsAt: "2026-10-11T04:00:00.000Z" }),
    ]);
    expect(totals).toEqual({ sessions: 3, hours: 10, days: 8 });
    expect(totalsLabel(totals)).toBe("3 sessions · 10 hours · 8 days of onboarding");
    expect(totalsLabel({ sessions: 1, hours: 1, days: 1 })).toBe("1 session · 1 hour · 1 day of onboarding");
    expect(totalsLabel({ sessions: 2, hours: 6, days: 0 })).toBe("2 sessions · 6 hours");
    expect(totalsLabel({ sessions: 0, hours: 0, days: 0 })).toBe("0 sessions");
  });
});

describe("rangeLabel", () => {
  it("names one month or a span", () => {
    expect(rangeLabel(october)).toBe("October 2026");
    expect(rangeLabel({ ...october, to: "2027-01" })).toBe("October 2026 – January 2027");
  });
});

describe("buildReport", () => {
  const sessions = [
    session({ id: 1, trainerId: 2, trainer: "Bo Diaz", startsAt: "2026-10-09T12:00:00.000Z", endsAt: "2026-10-09T14:00:00.000Z" }),
    session({ id: 2, trainerId: 1, trainer: "Ann Lee", startsAt: "2026-10-20T12:00:00.000Z", endsAt: "2026-10-20T14:00:00.000Z" }),
    session({ id: 3, trainerId: 2, trainer: "Bo Diaz", startsAt: "2026-10-02T12:00:00.000Z", endsAt: "2026-10-02T14:00:00.000Z" }),
    session({ id: 4, trainerId: 1, trainer: "Ann Lee", startsAt: "2026-12-01T12:00:00.000Z", endsAt: "2026-12-01T14:00:00.000Z" }),
  ];

  it("groups by trainer in the given order, each by date, leaving out other months", () => {
    const report = buildReport(sessions, october, [1, 2]);
    expect(report.title).toBe("Training report: all trainers");
    expect(report.range).toBe("October 2026");
    expect(report.groups.map((group) => [group.heading, group.rows.map((row) => row.id)])).toEqual([
      ["Ann Lee", [2]],
      ["Bo Diaz", [3, 1]],
    ]);
    expect(report.groups[1].totals).toEqual({ sessions: 2, hours: 4, days: 0 });
    expect(report.totals).toEqual({ sessions: 3, hours: 6, days: 0 });
  });

  it("lists by date in one section", () => {
    const report = buildReport(sessions, { ...october, group: "date" }, [1, 2]);
    expect(report.groups).toHaveLength(1);
    expect(report.groups[0].heading).toBeNull();
    expect(report.groups[0].rows.map((row) => row.id)).toEqual([3, 1, 2]);
  });

  it("names a single trainer in the title", () => {
    expect(buildReport([], october, [], "Ann Lee")).toMatchObject({ title: "Training report: Ann Lee", groups: [] });
  });
});

describe("monthOptions", () => {
  it("covers two years either side of today", () => {
    const options = monthOptions("2026-10-27", []);
    expect(options).toHaveLength(60);
    expect(options[0]).toEqual({ label: "January 2024", value: "2024-01" });
    expect(options.at(-1)).toEqual({ label: "December 2028", value: "2028-12" });
  });

  it("includes chosen months outside that span", () => {
    expect(monthOptions("2026-10-27", ["2021-03", "bad"])[0].value).toBe("2021-01");
  });
});
