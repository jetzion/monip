import { Gutter } from "@payloadcms/ui";
import Link from "next/link";
import type { ListViewServerProps, Where } from "payload";

import type { TrainingSession } from "@/payload-types";
import { initialsOf } from "@/lib/admin/initials";

import { calendarHref, gridRange, localDay, monthGrid, monthOf, readParams, type CalendarSession } from "@/lib/training/calendar";
import { preferredCombos } from "@/lib/training/cruise-choice";
import { upcomingCruiseCombos } from "@/lib/training/cruise-options";
import { cruiseChanges } from "@/lib/training/review";
import { readEstimate, travelStatus, type TravelRates } from "@/lib/training/estimate";
import { TRAINING_TYPES } from "@/lib/training/schedule";
import { isInPerson, needsTravel, readTravel, trainingDays, travelDefaults } from "@/lib/training/travel";
import { dayOf } from "@/lib/training/time";

import { TrainingNav } from "./TrainingNav";
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
  // Payload only renders this view for users who can read the collection (admins and trainers);
  // checked again because the cruise options query bypasses access control.
  if (user?.collection !== "users" || !["admin", "trainer"].includes(user.role ?? "")) return null;
  const params = readParams(searchParams);
  const now = new Date().toISOString();
  const today = now.slice(0, 10);
  const month = monthOf(params.calMonth, today);
  const days = monthGrid(month);
  const range = gridRange(days);
  const access = { user, overrideAccess: false, depth: 0, pagination: false } as const;

  const where: Where[] = [{ startsAt: { less_than: range.to } }, { endsAt: { greater_than: range.from } }];
  if (params.calTrainer) where.push({ trainer: { equals: params.calTrainer } });
  if (params.calCruise) where.push({ cruise: { equals: params.calCruise } });
  if (params.calType) where.push({ type: { equals: params.calType } });

  const [allCombos, preferences, trainers, zones, costs, shown, scheduled, selected] = await Promise.all([
    upcomingCruiseCombos(payload, today),
    payload.findGlobal({ slug: "training-preferences", user, overrideAccess: false }),
    payload.find({
      collection: "trainers",
      sort: ["lastName", "firstName"],
      select: { name: true, firstName: true, lastName: true, homeBase: true },
      populate: { "port-time-zones": { port: true } },
      ...access,
      depth: 1,
    }),
    payload.find({
      collection: "port-time-zones",
      select: { port: true, timeZone: true, flightFare: true, hotelPerNight: true, rideshareFare: true },
      ...access,
    }),
    payload.findGlobal({ slug: "training-costs", user, overrideAccess: false }),
    payload.find({ collection: "training-sessions", where: { and: where }, ...access }),
    payload.find({
      collection: "training-sessions",
      select: { title: true, cruise: true, cruiseCopy: true, startsAt: true, timeZone: true, canceled: true },
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
        select: { ship: true, cruiseLine: true, startDate: true, endDate: true, startPort: true, endPort: true, arrival: true, departure: true },
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
    // Canceled sessions need no review.
    .filter((session) => changesById.get(session.id)?.length && session.startsAt && !session.canceled)
    .map((session) => ({
      id: session.id,
      title: session.title ?? "Training session",
      day: localDay(session.startsAt!, session.timeZone ?? "UTC"),
    }))
    .sort((a, b) => a.day.localeCompare(b.day));

  const trainerName = new Map(trainers.docs.map((trainer) => [trainer.id, trainer.name ?? ""]));
  const nameOf = (trainer: unknown) => trainerName.get(typeof trainer === "object" ? (trainer as { id: number }).id : (trainer as number)) ?? "Unknown trainer";
  const initialsById = new Map(trainers.docs.map((trainer) => [trainer.id, initialsOf(trainer.firstName, trainer.lastName)]));
  const initialsOfTrainer = (trainer: unknown) =>
    initialsById.get(typeof trainer === "object" ? (trainer as { id: number }).id : (trainer as number)) ?? "?";
  const trainerOptions = trainers.docs.map((trainer) => ({ label: trainer.name ?? "", value: String(trainer.id) }));
  const homeBases: Record<string, string | null> = Object.fromEntries(
    trainers.docs.map((trainer) => [String(trainer.id), typeof trainer.homeBase === "object" ? (trainer.homeBase?.port ?? null) : null]),
  );
  const rates: TravelRates = {
    defaults: {
      flight: costs.trip ?? null,
      hotel: costs.night ?? null,
      carRental: costs.carRentalPerDay ?? null,
      rideshare: costs.rideshareFare ?? null,
    },
    ports: Object.fromEntries(
      zones.docs.map((zone) => [zone.port, { flight: zone.flightFare ?? null, hotel: zone.hotelPerNight ?? null, rideshare: zone.rideshareFare ?? null }]),
    ),
  };
  /** Whether a session still needs travel details or a new estimate. */
  const statusOf = (session: TrainingSession) => {
    const trainerId = typeof session.trainer === "object" ? session.trainer.id : session.trainer;
    const cruiseId = typeof session.cruise === "object" ? session.cruise?.id : session.cruise;
    const port = session.cruiseCopy?.startPort ?? null;
    return travelStatus({
      needsTravel: needsTravel(session.type, homeBases[String(trainerId)] ?? null, port, liveById.get(cruiseId ?? -1)?.endPort),
      canceled: Boolean(session.canceled),
      travel: session.travel,
      estimate: session.estimate,
      port,
      startsAt: session.startsAt ?? "",
      endsAt: session.endsAt ?? "",
    });
  };

  const sessions: CalendarSession[] = shown.docs.map((session) => ({
    id: session.id,
    type: session.type,
    startsAt: session.startsAt!,
    endsAt: session.endsAt!,
    timeZone: session.timeZone ?? "UTC",
    trainer: nameOf(session.trainer),
    trainerInitials: initialsOfTrainer(session.trainer),
    ship: session.cruiseCopy?.ship ?? "Unknown ship",
    needsReview: !session.canceled && Boolean(changesById.get(session.id)?.length),
    canceled: Boolean(session.canceled),
    travelStatus: statusOf(session),
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

  // Schedule training offers only preferred ships and ports, when any are saved.
  const preferred = { ships: preferences.ships ?? [], ports: preferences.ports ?? [] };
  const filtered = preferred.ships.length > 0 || preferred.ports.length > 0;
  const combos = preferredCombos(allCombos, preferred);

  /** The selected session's travel status, its trip and port (for a new estimate), and the acknowledged estimate. */
  const selectedTravel = (session: TrainingSession) => {
    const trainerId = typeof session.trainer === "object" ? session.trainer.id : session.trainer;
    const cruiseId = typeof session.cruise === "object" ? session.cruise?.id : session.cruise;
    const timed = session.startsAt && session.endsAt && session.timeZone;
    const days = timed ? trainingDays({ startsAt: session.startsAt!, endsAt: session.endsAt!, timeZone: session.timeZone! }) : null;
    const port = session.cruiseCopy?.startPort ?? null;
    const endPort = liveById.get(cruiseId ?? -1)?.endPort ?? null;
    // Planner sessions have no trip yet: suggest one from the training, as Schedule training does.
    const suggested =
      readTravel(session.travel) ??
      (days && isInPerson(session.type) ? travelDefaults(session.type, days, homeBases[String(trainerId)] ?? null) : null);
    return {
      status: statusOf(session),
      suggested,
      days,
      port,
      endPort: session.type === "onboarding" && endPort && endPort !== port ? endPort : null,
      rates,
      stored: readEstimate(session.estimate),
    };
  };

  const closeHref = calendarHref(params, { calSession: undefined });

  return (
    <div className="collection-list training-schedule">
      <Gutter className="collection-list__wrap">
        <TrainingNav />
        <header className="training-schedule__header">
          <h1>{collectionConfig.labels.plural as string}</h1>
          <p>{collectionConfig.admin.description as string}</p>
        </header>

        {filtered && (
          <p className="training-form__check">
            {combos.length > 0
              ? "Schedule training lists only the preferred ships and ports from "
              : "No upcoming cruises match the preferred ships and ports. Change them in "}
            <Link href={`${payload.config.routes.admin}/training-preferences`}>Training preferences</Link>.
          </p>
        )}
        <TrainingFormClient
          trainers={trainerOptions}
          homeBases={homeBases}
          rates={rates}
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
              changes={selected.canceled ? [] : (changesById.get(selected.id) ?? [])}
              canEdit={user.role === "admin" || !selected.startsAt || selected.startsAt > now}
              travel={selectedTravel(selected)}
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
