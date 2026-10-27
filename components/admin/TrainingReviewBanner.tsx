import Link from "next/link";

import { calendarHref, type CalendarParams } from "@/lib/training/calendar";

const dayLabel = (day: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" }).format(new Date(`${day}T12:00:00Z`));

type Props = {
  sessions: { id: number; title: string; day: string }[];
  params: CalendarParams;
};

/** Lists sessions, in any month, whose cruise changed or was removed since they were saved. */
export function TrainingReviewBanner({ sessions, params }: Props) {
  if (sessions.length === 0) return null;
  return (
    <section className="training-review" aria-labelledby="training-review-title">
      <h3 id="training-review-title">
        Cruise changed — {sessions.length} {sessions.length === 1 ? "session needs" : "sessions need"} review
      </h3>
      <ul>
        {sessions.map((session) => (
          <li key={session.id}>
            <Link href={calendarHref(params, { calMonth: session.day.slice(0, 7), calSession: String(session.id) })}>
              {dayLabel(session.day)}: {session.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
