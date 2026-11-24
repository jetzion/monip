import Link from "next/link";

import {
  calendarHref,
  entryLabel,
  entryText,
  monthTitle,
  placeSessions,
  shiftMonth,
  type CalendarParams,
  type CalendarSession,
} from "@/lib/training/calendar";
import { TRAINING_TYPES } from "@/lib/training/schedule";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const dayNumber = (day: string) => Number(day.slice(8, 10));

/** "Thursday 1 October", shown instead of the grid on narrow screens. */
const longDate = (day: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" }).format(new Date(`${day}T12:00:00Z`));

type Props = {
  month: string;
  today: string;
  days: string[];
  sessions: CalendarSession[];
  params: CalendarParams;
};

/**
 * Monthly grid of training sessions, coloured by training type, with previous,
 * current, and next month links. Today is highlighted; past days and weekends are muted.
 */
export function TrainingCalendar({ month, today, days, sessions, params }: Props) {
  const byDay = placeSessions(sessions, days);
  const weeks = Array.from({ length: days.length / 7 }, (_, week) => days.slice(week * 7, week * 7 + 7));
  const selected = params.calSession;

  return (
    <>
      <div className="training-calendar__bar">
        <nav aria-label="Change month" className="training-calendar__nav">
          <Link
            href={calendarHref(params, { calMonth: shiftMonth(month, -1), calSession: undefined })}
            aria-label="Previous month"
            title="Previous month"
          >
            <span aria-hidden="true">‹</span>
          </Link>
          <Link href={calendarHref(params, { calMonth: today.slice(0, 7), calSession: undefined })}>Today</Link>
          <Link href={calendarHref(params, { calMonth: shiftMonth(month, 1), calSession: undefined })} aria-label="Next month" title="Next month">
            <span aria-hidden="true">›</span>
          </Link>
        </nav>
        <h2 id="training-calendar-title">{monthTitle(month)}</h2>
        <p className="training-calendar__count">
          {sessions.length} {sessions.length === 1 ? "session" : "sessions"} shown
        </p>
      </div>

      <table className="training-calendar__grid" aria-labelledby="training-calendar-title">
        <thead>
          <tr>
            {WEEKDAYS.map((weekday) => (
              <th key={weekday} scope="col">
                {weekday}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week[0]}>
              {week.map((day, weekday) => {
                const entries = byDay.get(day) ?? [];
                const classes = [
                  "training-calendar__day",
                  day.slice(0, 7) !== month && "is-outside",
                  day === today && "is-today",
                  day < today && "is-past",
                  weekday >= 5 && "is-weekend",
                  entries.length === 0 && "is-empty",
                ];
                return (
                  <td key={day} className={classes.filter(Boolean).join(" ")}>
                    <span className="training-calendar__date">
                      <time dateTime={day}>{dayNumber(day)}</time>
                      <span className="training-calendar__long-date">{longDate(day)}</span>
                    </span>
                    <ul>
                      {entries.map((session) => (
                        <li key={session.id}>
                          <Link
                            href={calendarHref(params, { calSession: String(session.id) })}
                            className={`training-calendar__entry training-calendar__entry--${session.type}${session.canceled ? " training-calendar__entry--canceled" : ""}`}
                            aria-current={selected === String(session.id) ? "true" : undefined}
                            // The entry shows initials and ship; the full description is the hover text and accessible name.
                            title={entryLabel(session)}
                            aria-label={entryLabel(session)}
                          >
                            {session.canceled && <span className="training-calendar__canceled">Canceled</span>}
                            {session.needsReview && <span className="training-calendar__review">Review</span>}
                            {session.travelStatus && session.travelStatus !== "ok" && (
                              <span className="training-calendar__travel">{session.travelStatus === "travelNeeded" ? "Travel" : "Estimate"}</span>
                            )}
                            {entryText(session)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="training-calendar__legend" aria-label="Training types">
        {TRAINING_TYPES.map((type) => (
          <li key={type.value} className={`training-calendar__entry--${type.value}`}>
            {type.label}
          </li>
        ))}
      </ul>
    </>
  );
}
