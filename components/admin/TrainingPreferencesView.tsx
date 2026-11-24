import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter } from "@payloadcms/ui";
import type { AdminViewServerProps } from "payload";

import { getSailingFilterOptions } from "@/lib/sailings/filter-options";

import { TrainingNav } from "./TrainingNav";
import { TrainingPreferencesForm } from "./TrainingPreferencesForm";

/**
 * Training preferences at /admin/training-preferences: every cruise line, ship,
 * and start port in the Cruise Fleet Schedule, with the preferred ships and
 * ports ticked. Admins and trainers only.
 */
export async function TrainingPreferencesView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, locale, permissions, visibleEntities } = initPageResult;
  const { payload, user } = req;
  const template = { i18n: req.i18n, locale, params, payload, permissions, searchParams, user: user ?? undefined, visibleEntities };

  if (user?.collection !== "users" || !["admin", "trainer"].includes(user.role ?? "")) {
    return (
      <DefaultTemplate {...template}>
        <Gutter>
          <h1>Training preferences</h1>
          <p>Only admins and trainers can use training preferences.</p>
        </Gutter>
      </DefaultTemplate>
    );
  }

  const [options, preferences] = await Promise.all([
    getSailingFilterOptions(payload, user),
    payload.findGlobal({ slug: "training-preferences", req, user, overrideAccess: false }),
  ]);
  const cruiseLines = options.cruiseLines.map((name) => ({ name, ships: options.shipsByCruiseLine[name] ?? [] }));

  return (
    <DefaultTemplate {...template}>
      <div className="training-schedule training-preferences-page">
        <Gutter>
          <TrainingNav />
          <header className="training-schedule__header">
            <h1>Training preferences</h1>
            <p>
              Every cruise line, ship, and start port in the Cruise Fleet Schedule. Tick the ships and ports preferred for
              training, then save.
            </p>
          </header>
          <TrainingPreferencesForm
            cruiseLines={cruiseLines}
            ports={options.ports}
            initialShips={preferences.ships ?? []}
            initialPorts={preferences.ports ?? []}
          />
        </Gutter>
      </div>
    </DefaultTemplate>
  );
}
