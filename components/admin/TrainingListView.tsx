import { Gutter } from "@payloadcms/ui";
import Link from "next/link";
import type { ListViewServerProps, Where } from "payload";

import { calendarHref, gridRange, localDay, monthGrid, monthOf, readParams, type CalendarSession } from "@/lib/training/calendar";
import { upcomingCruiseCombos } from "@/lib/training/cruise-options";
import { cruiseChanges } from "@/lib/training/review";
import { TRAINING_TYPES } from "@/lib/training/schedule";
import { dayOf } from "@/lib/training/time";

import { TrainingCalendar } from "./TrainingCalendar";
import { TrainingCalendarFilters } from "./TrainingCalendarFilters";
import { TrainingFormClient } from "./TrainingFormClient";
import { TrainingReviewBanner } from "./TrainingReviewBanner";
import { TrainingSessionDetails } from "./TrainingSessionDetails";

const day = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));

/**
 * The Training Schedule page: the scheduling form, then a monthly calendar
 * with filters and the selected session's details. Month, filters, and
 * selection live in the URL (calMonth, calTrainer, calCruise, calType, calSession).
 */
export async function TrainingListView({ payload, user, searchParams, collectionConfig }: ListViewServerProps) {
  // Payload only renders this view for users who can read the collection (admins);
  // checked again because the cruise options query bypasses access control.
  if (user?.collection !== "users" || user.role !== "admin") return null;
  const params = readParams(searchParams);
  const today = new Date().toISOString().slice(0, 10);
  const month = monthOf(params.calMonth, today);
  const days = monthGrid(month);
  const range = gridRange(days);
  const access = { user, overrideAccess: false, depth: 0, pagination: false } as const;

  const where: Where[] = [{ startsAt: { less_than: range.to } }, { endsAt: { greater_than: range.from } }];
  if (params.calTrainer) where.push({ trainer: { equals: params.calTrainer } });
  if (params.calCruise) where.push({ cruise: { equals: params.calCruise } });
  if (params.calType) where.push({ type: { equals: params.calType } });

  const [combos, trainers, zones, shown, scheduled, selected] = await Promise.all([
    upcomingCruiseCombos(payload, today),
    payload.find({ collection: "trainers", sort: ["lastName", "firstName"], select: { name: true }, ...access }),
    payload.find({ collection: "port-time-zones", select: { port: true, timeZone: true }, ...access }),
    payload.find({ collection: "training-sessions", where: { and: where }, ...access }),
    payload.find({
      collection: "training-sessions",
      select: { title: true, cruise: true, cruiseCopy: true, startsAt: true, timeZone: true },
      ...access,
    }),
    params.calSession
      ? payload.findByID({ collection: "training-sessions", id: params.calSession, user, overrideAccess: false, depth: 1, disableErrors: true })
      : null,
  ]);

  // Compare each session's copy of its cruise with the cruise as it is now.
  const cruiseIds = [...new Set(scheduled.docs.map((session) => session.cruise).filter((id): id is number => typeof id === "number"))];
  const live = cruiseIds.length
    ? await payload.find({
        collection: "cruise-sailings",
        where: { id: { in: cruiseIds } },
        select: { ship: true, cruiseLine: true, startDate: true, endDate: true, startPort: true, arrival: true, departure: true },
        ...access,
      })
    : { docs: [] };
  const liveById = new Map(live.docs.map((cruise) => [cruise.id, cruise]));
  const changesById = new Map(
    scheduled.docs.map((session) => [
      session.id,
      cruiseChanges(session.cruiseCopy, typeof session.cruise === "number" ? (liveById.get(session.cruise) ?? null) : null),
    ]),
  );
  const toReview = scheduled.docs
    .filter((session) => changesById.get(session.id)?.length && session.startsAt)
    .map((session) => ({
      id: session.id,
      title: session.title ?? "Training session",
      day: localDay(session.startsAt!, session.timeZone ?? "UTC"),
    }))
    .sort((a, b) => a.day.localeCompare(b.day));

  const trainerName = new Map(trainers.docs.map((trainer) => [trainer.id, trainer.name ?? ""]));
  const nameOf = (trainer: unknown) => trainerName.get(typeof trainer === "object" ? (trainer as { id: number }).id : (trainer as number)) ?? "Unknown trainer";
  const trainerOptions = trainers.docs.map((trainer) => ({ label: trainer.name ?? "", value: String(trainer.id) }));

  const sessions: CalendarSession[] = shown.docs.map((session) => ({
    id: session.id,
    type: session.type,
    startsAt: session.startsAt!,
    endsAt: session.endsAt!,
    timeZone: session.timeZone ?? "UTC",
    trainer: nameOf(session.trainer),
    ship: session.cruiseCopy?.ship ?? "Unknown ship",
    needsReview: Boolean(changesById.get(session.id)?.length),
  }));

  const cruiseOptions = [
    ...new Map(
      scheduled.docs
        .filter((session) => session.cruise && session.cruiseCopy?.startDate)
        .map((session) => [String(session.cruise), session.cruiseCopy!]),
    ),
  ]
    .sort(([, a], [, b]) => dayOf(a.startDate!).localeCompare(dayOf(b.startDate!)))
    .map(([id, copy]) => ({ label: `${copy.ship} · ${day(copy.startDate!)}`, value: id }));

  const closeHref = calendarHref(params, { calSession: undefined });

  return (
    <div className="collection-list training-schedule">
      <Gutter className="collection-list__wrap">
        <header className="training-schedule__header">
          <h1>{collectionConfig.labels.plural as string}</h1>
          <p>{collectionConfig.admin.description as string}</p>
          <p>
            <Link href={`${payload.config.routes.admin}/training-report`}>Training report</Link> (PDF download)
          </p>
        </header>

        <TrainingFormClient
          trainers={trainerOptions}
          portZones={Object.fromEntries(zones.docs.map((zone) => [zone.port, zone.timeZone]))}
          combos={combos}
          today={today}
        />

        <section className="training-calendar" aria-label="Training calendar">
          <TrainingReviewBanner sessions={toReview} params={params} />
          <TrainingCalendarFilters
            filters={[
              { key: "calTrainer", label: "Trainer", options: trainerOptions, value: params.calTrainer },
              { key: "calCruise", label: "Cruise", options: cruiseOptions, value: params.calCruise },
              { key: "calType", label: "Training type", options: TRAINING_TYPES.map((type) => ({ ...type })), value: params.calType },
            ]}
          />
          {selected && (
            <TrainingSessionDetails
              session={selected}
              trainer={nameOf(selected.trainer)}
              changes={changesById.get(selected.id) ?? []}
              editHref={`${payload.config.routes.admin}/collections/training-sessions/${selected.id}`}
              closeHref={closeHref}
            />
          )}
          <TrainingCalendar month={month} today={today} days={days} sessions={sessions} params={params} />
        </section>
      </Gutter>
    </div>
  );
}
