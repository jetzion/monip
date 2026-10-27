import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter } from "@payloadcms/ui";
import Link from "next/link";
import type { AdminViewServerProps } from "payload";

import { monthOptions, readReportParams, reportQuery, totalsLabel, type ReportGroup } from "@/lib/training/report";
import { loadReport, reportTrainers } from "@/lib/training/report-data";

import { TrainingReportFilters } from "./TrainingReportFilters";

const GROUP_OPTIONS = [
  { label: "Group by trainer", value: "trainer" },
  { label: "List by date", value: "date" },
];

function ReportTable({ group, showTrainer }: { group: ReportGroup; showTrainer: boolean }) {
  return (
    <div className="training-report__table">
      <table>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Time</th>
            <th scope="col">Time zone</th>
            <th scope="col">Training type</th>
            {showTrainer && <th scope="col">Trainer</th>}
            <th scope="col">Cruise line</th>
            <th scope="col">Ship</th>
            <th scope="col">Start port</th>
            <th scope="col">Cruise dates</th>
          </tr>
        </thead>
        <tbody>
          {group.rows.map((row) => (
            <tr key={row.id}>
              <td>{row.dates}</td>
              <td>{row.time}</td>
              <td>{row.timeZone}</td>
              <td>{row.type}</td>
              {showTrainer && <td>{row.trainer}</td>}
              <td>{row.cruiseLine}</td>
              <td>{row.ship}</td>
              <td>{row.startPort}</td>
              <td>{row.cruiseDates}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Training report at /admin/training-report: one trainer or all, for a range of
 * months, grouped by trainer or listed by date, with a PDF download. Admins only.
 */
export async function TrainingReportView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, locale, permissions, visibleEntities } = initPageResult;
  const { payload, user } = req;
  const template = { i18n: req.i18n, locale, params, payload, permissions, searchParams, user: user ?? undefined, visibleEntities };
  const admin = payload.config.routes.admin;

  if (user?.collection !== "users" || user.role !== "admin") {
    return (
      <DefaultTemplate {...template}>
        <Gutter>
          <h1>Training report</h1>
          <p>Only admins can see the training report.</p>
        </Gutter>
      </DefaultTemplate>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const chosen = readReportParams(searchParams, today);
  const raw = (key: string) => (typeof searchParams?.[key] === "string" ? (searchParams[key] as string) : "");
  const values = "error" in chosen ? { trainer: raw("trainer"), from: raw("from"), to: raw("to"), group: raw("group") || "trainer" } : chosen;
  const [trainers, report] = await Promise.all([reportTrainers(payload, user), "error" in chosen ? null : loadReport(payload, user, chosen)]);
  const months = monthOptions(today, [values.from, values.to]);
  const grouped = values.group !== "date";
  const hasRows = report?.groups.some((group) => group.rows.length);
  const pdfHref = "error" in chosen ? "" : `${payload.config.routes.api}/training-sessions/report?${reportQuery(chosen)}`;

  return (
    <DefaultTemplate {...template}>
      <div className="training-schedule training-report">
        <Gutter>
          <header className="training-schedule__header">
            <p>
              <Link href={`${admin}/collections/training-sessions`}>Training Schedule</Link>
            </p>
            <h1>Training report</h1>
            <p>Training sessions for one trainer or all trainers over a range of months. Times are in each session&apos;s own time zone.</p>
          </header>

          <TrainingReportFilters
            fields={[
              {
                key: "trainer",
                label: "Trainer",
                options: trainers.map((trainer) => ({ label: trainer.name, value: String(trainer.id) })),
                value: values.trainer ?? "",
                clearable: true,
              },
              { key: "from", label: "From", options: months, value: values.from },
              { key: "to", label: "To", options: months, value: values.to },
              { key: "group", label: "Layout", options: GROUP_OPTIONS, value: values.group },
            ]}
          />

          {"error" in chosen && (
            <p className="training-report__error" role="alert">
              {chosen.error}
            </p>
          )}

          {report && (
            <section aria-labelledby="training-report-title">
              <div className="training-report__heading">
                <div>
                  <h2 id="training-report-title">{report.title}</h2>
                  <p>{report.range}</p>
                </div>
                <a
                  className="btn btn--style-primary btn--size-medium"
                  href={pdfHref}
                  download
                >
                  Download PDF
                </a>
              </div>
              {!hasRows && <p>No training sessions in these months.</p>}
              {hasRows &&
                report.groups.map((group) => (
                  <div className="training-report__group" key={group.heading ?? "all"}>
                    {group.heading && <h3>{group.heading}</h3>}
                    <ReportTable group={group} showTrainer={!grouped} />
                    {grouped && <p className="training-report__totals">{totalsLabel(group.totals)}</p>}
                  </div>
                ))}
              {hasRows && <p className="training-report__totals">Total: {totalsLabel(report.totals)}</p>}
            </section>
          )}
        </Gutter>
      </div>
    </DefaultTemplate>
  );
}
