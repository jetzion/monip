import Link from "next/link";

import { cruiseLabel } from "@/lib/training/form";
import { describeSession } from "@/lib/training/schedule";
import type { CruiseSailing, TrainingSession } from "@/payload-types";

import { TrainingSessionApply } from "./TrainingSessionApply";
import { TrainingSessionDelete } from "./TrainingSessionDelete";

const stamp = (iso: string) =>
  `${new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(iso))} UTC`;

type Props = {
  session: TrainingSession;
  trainer: string;
  changes: string[];
  editHref: string;
  closeHref: string;
};

/** Full details of the selected session, with Edit and Delete. */
export function TrainingSessionDetails({ session, trainer, changes, editHref, closeHref }: Props) {
  const live = typeof session.cruise === "object" ? (session.cruise as CruiseSailing | null) : null;
  const copy = session.cruiseCopy;
  const cruise = live
    ? cruiseLabel(live)
    : copy?.ship
      ? `${cruiseLabel({ id: 0, ship: copy.ship, cruiseLine: copy.cruiseLine ?? "", startDate: copy.startDate ?? "", endDate: copy.endDate, startPort: copy.startPort })} (no longer in the Cruise Fleet Schedule)`
      : "Unknown cruise";
  const when =
    session.startsAt && session.endsAt && session.timeZone
      ? describeSession({ type: session.type, startsAt: session.startsAt, endsAt: session.endsAt, timeZone: session.timeZone })
      : "Not set";

  return (
    <section className="training-details" aria-labelledby="training-details-title">
      <h3 id="training-details-title">Session details</h3>
      {changes.length > 0 && (
        <div className="training-details__review" role="note" aria-label="Cruise changed">
          <p>
            <strong>Cruise changed — review.</strong> The session was not changed.{" "}
            {live
              ? "Update it to the cruise's current details (times are recalculated and conflicts checked), edit it, or delete it."
              : "Edit it to choose another cruise, or delete it."}
          </p>
          <ul>
            {changes.map((change) => (
              <li key={change}>{change}</li>
            ))}
          </ul>
          {live && (
            <div className="training-details__actions">
              <TrainingSessionApply id={session.id} />
            </div>
          )}
        </div>
      )}
      <dl>
        <dt>When</dt>
        <dd>{when}</dd>
        <dt>Trainer</dt>
        <dd>{trainer}</dd>
        <dt>Cruise</dt>
        <dd>{cruise}</dd>
        <dt>Created</dt>
        <dd>{stamp(session.createdAt)}</dd>
        <dt>Last updated</dt>
        <dd>{stamp(session.updatedAt)}</dd>
      </dl>
      <div className="training-details__actions">
        <Link href={editHref} className="btn btn--style-primary btn--size-medium">
          Edit
        </Link>
        <TrainingSessionDelete id={session.id} closeHref={closeHref} />
        <Link href={closeHref}>Close</Link>
      </div>
    </section>
  );
}
