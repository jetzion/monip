import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter } from "@payloadcms/ui";
import Link from "next/link";
import type { AdminViewServerProps } from "payload";

import { upcomingCruiseCombos } from "@/lib/training/cruise-options";
import { cruiseOptions } from "@/lib/training/planner/cruise-options";
import { planRows } from "@/lib/training/planner/rows";
import { isStoredPlan } from "@/lib/training/planner/stored";
import { addDays } from "@/lib/training/time";

import { TrainingPlannerResults } from "./TrainingPlannerResults";
import { TrainingPlannerSettings } from "./TrainingPlannerSettings";

function ShipList({ title, items }: { title: string; items: { ship: string; reason: string }[] }) {
  if (items.length === 0) return null;
  return (
    <details className="training-planner__list">
      <summary>
        {title} ({items.length})
      </summary>
      <ul>
        {items.map((item) => (
          <li key={item.ship}>
            <strong>{item.ship}:</strong> {item.reason}
          </li>
        ))}
      </ul>
    </details>
  );
}

/**
 * Training planner at /admin/training-planner: settings, the current plan with
 * reasons and totals, and Accept selected. Admins only.
 */
export async function TrainingPlannerView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, locale, permissions, visibleEntities } = initPageResult;
  const { payload, user } = req;
  const template = { i18n: req.i18n, locale, params, payload, permissions, searchParams, user: user ?? undefined, visibleEntities };
  const admin = payload.config.routes.admin;

  if (user?.collection !== "users" || user.role !== "admin") {
    return (
      <DefaultTemplate {...template}>
        <Gutter>
          <h1>Training planner</h1>
          <p>Only admins can use the training planner.</p>
        </Gutter>
      </DefaultTemplate>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const access = { req, user, overrideAccess: false } as const;
  const [{ current }, trainers, combos] = await Promise.all([
    payload.findGlobal({ slug: "training-plan", ...access }),
    payload.find({ collection: "trainers", ...access, depth: 0, limit: 0, pagination: false, select: { name: true } }),
    upcomingCruiseCombos(payload, today),
  ]);
  const stored = isStoredPlan(current) ? current : null;
  const cruises = stored ? await cruiseOptions(req, stored) : {};
  const trainerOptions = trainers.docs.map((trainer) => ({ label: trainer.name ?? "", value: String(trainer.id) }));
  const rows = stored ? planRows(stored, new Map(trainers.docs.map((trainer) => [trainer.id, trainer.name ?? ""]))) : null;
  const ships = [...new Set(combos.map((combo) => combo.ship))].sort((a, b) => a.localeCompare(b));
  const initial = stored?.settings ?? {
    from: addDays(today, 1),
    to: addDays(today, 30),
    preset: "balanced" as const,
    ships: [],
    priorityShips: [],
    onlineHours: 2 as const,
    maxOnboardingNights: 7,
  };

  return (
    <DefaultTemplate {...template}>
      <div className="training-schedule training-report training-planner">
        <Gutter>
          <header className="training-schedule__header">
            <p>
              <Link href={`${admin}/collections/training-sessions`}>Training Schedule</Link>
            </p>
            <h1>Training planner</h1>
            <p>
              Recommends training for each ship with cruises in a date range, checked against trainers&apos; existing sessions,
              travel, and monthly limits. Nothing changes until you accept it.
            </p>
          </header>

          <TrainingPlannerSettings initial={initial} ships={ships} hasPlan={Boolean(stored)} />

          {rows && (
            <section aria-labelledby="planner-plan-title">
              <h2 id="planner-plan-title">{rows.title}</h2>
              <p className="training-form__check">{rows.made}</p>
              <ul className="training-planner__summary">
                {rows.lines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
                {rows.load.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <TrainingPlannerResults
                key={stored!.createdAt}
                proposals={rows.proposals}
                moves={rows.moves}
                cruises={cruises}
                trainers={trainerOptions}
              />
              <ShipList title="Ships not planned" items={rows.unscheduled} />
              <ShipList title="Ships skipped for missing data" items={rows.skipped} />
            </section>
          )}
        </Gutter>
      </div>
    </DefaultTemplate>
  );
}
