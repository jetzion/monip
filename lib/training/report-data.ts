import type { Payload, TypedUser, Where } from "payload";

import { buildReport, reportQueryRange, type Report, type ReportParams } from "./report";

/** Trainers in name order, for the report's dropdown and section order. */
export async function reportTrainers(payload: Payload, user: TypedUser) {
  const trainers = await payload.find({
    collection: "trainers",
    sort: ["lastName", "firstName"],
    select: { name: true },
    pagination: false,
    depth: 0,
    user,
    overrideAccess: false,
  });
  return trainers.docs.map((trainer) => ({ id: trainer.id, name: trainer.name ?? "" }));
}

/** The report for the parameters, read as the user so only admins get sessions. */
export async function loadReport(payload: Payload, user: TypedUser, params: ReportParams): Promise<Report> {
  const range = reportQueryRange(params);
  const where: Where[] = [{ startsAt: { less_than: range.to } }, { endsAt: { greater_than: range.from } }];
  if (params.trainer) where.push({ trainer: { equals: params.trainer } });

  const [trainers, sessions] = await Promise.all([
    reportTrainers(payload, user),
    payload.find({
      collection: "training-sessions",
      where: { and: where },
      select: { type: true, startsAt: true, endsAt: true, timeZone: true, trainer: true, cruiseCopy: true },
      sort: "startsAt",
      pagination: false,
      depth: 0,
      user,
      overrideAccess: false,
    }),
  ]);
  const names = new Map(trainers.map((trainer) => [trainer.id, trainer.name]));
  const rows = sessions.docs
    .filter((session) => session.startsAt && session.endsAt)
    .map((session) => {
      const trainerId = session.trainer as number;
      return {
        id: session.id,
        type: session.type,
        startsAt: session.startsAt!,
        endsAt: session.endsAt!,
        timeZone: session.timeZone ?? "UTC",
        trainerId,
        trainer: names.get(trainerId) ?? "Unknown trainer",
        cruiseCopy: session.cruiseCopy,
      };
    });
  const trainerName = params.trainer ? (names.get(Number(params.trainer)) ?? "Unknown trainer") : undefined;
  return buildReport(rows, params, trainers.map((trainer) => trainer.id), trainerName);
}
