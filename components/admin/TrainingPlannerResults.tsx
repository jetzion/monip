"use client";

import { Button } from "@payloadcms/ui";
import { useRouter } from "next/navigation";
import { Fragment, useState } from "react";

import type { MoveRow, ProposalRow } from "@/lib/training/planner/rows";
import type { ItemStatus } from "@/lib/training/planner/stored";

import { type Option, TrainingPlannerEdit } from "./TrainingPlannerEdit";
import { errorOf } from "./TrainingPlannerSettings";

type Props = {
  proposals: ProposalRow[];
  moves: MoveRow[];
  /** Each planned ship's cruises in the plan's dates, for editing. */
  cruises: Record<string, Option[]>;
  trainers: Option[];
};

function Status({ status }: { status: ItemStatus | null }) {
  if (!status) return null;
  if (status.status === "accepted") return <span className="training-planner__accepted">Accepted</span>;
  return <span className="training-planner__failed">Not saved: {status.message}</span>;
}

/** Toggles one index in a set of ticked rows. */
const toggle = (set: Set<number>, index: number) => {
  const next = new Set(set);
  if (next.has(index)) next.delete(index);
  else next.add(index);
  return next;
};

/** Proposed sessions and moves with tick boxes; Accept selected saves the ticked ones. */
export function TrainingPlannerResults({ proposals, moves, cruises, trainers }: Props) {
  const router = useRouter();
  const open = (rows: { index: number; status: ItemStatus | null }[]) =>
    rows.filter((row) => row.status?.status !== "accepted").map((row) => row.index);
  const [pickedProposals, setPickedProposals] = useState(new Set<number>());
  const [pickedMoves, setPickedMoves] = useState(new Set<number>());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const count = pickedProposals.size + pickedMoves.size;
  const openMoves = open(moves);

  const accept = async () => {
    setBusy(true);
    setError("");
    const response = await fetch("/api/globals/training-plan/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ proposals: [...pickedProposals], moves: [...pickedMoves] }),
    }).catch(() => null);
    setBusy(false);
    if (!response) return setError("The server could not be reached. Try again.");
    if (!response.ok) return setError(await errorOf(response, "The selection could not be saved. Try again."));
    setPickedProposals(new Set());
    setPickedMoves(new Set());
    router.refresh();
  };

  return (
    <>
      {moves.length > 0 && (
        <section aria-labelledby="planner-moves-title">
          <h3 id="planner-moves-title">Moves of existing sessions</h3>
          <p>Each move frees a trainer for a ship that could not be trained otherwise. Tell the trainer when you accept one.</p>
          <div className="training-report__table">
            <table>
              <thead>
                <tr>
                  <th scope="col">
                    <input
                      type="checkbox"
                      aria-label="Tick all moves"
                      checked={openMoves.length > 0 && openMoves.every((index) => pickedMoves.has(index))}
                      onChange={(event) => setPickedMoves(new Set(event.target.checked ? openMoves : []))}
                    />
                  </th>
                  <th scope="col">Ship</th>
                  <th scope="col">Now</th>
                  <th scope="col">Move to</th>
                  <th scope="col">Why</th>
                </tr>
              </thead>
              <tbody>
                {moves.map((row) => (
                  <tr key={row.index}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Accept move of ${row.ship}`}
                        disabled={row.status?.status === "accepted"}
                        checked={pickedMoves.has(row.index)}
                        onChange={() => setPickedMoves((set) => toggle(set, row.index))}
                      />
                    </td>
                    <td>{row.ship}</td>
                    <td>{row.from}</td>
                    <td>{row.to}</td>
                    <td>
                      {row.reason} <Status status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section aria-labelledby="planner-proposals-title">
        <h3 id="planner-proposals-title">Proposed sessions</h3>
        {proposals.length === 0 ? (
          <p>No sessions could be proposed. See the ships not planned below.</p>
        ) : (
          <div className="training-report__table">
            <table>
              <thead>
                <tr>
                  <th scope="col">
                    <input
                      type="checkbox"
                      aria-label="Tick all sessions"
                      checked={open(proposals).length > 0 && open(proposals).every((index) => pickedProposals.has(index))}
                      onChange={(event) => setPickedProposals(new Set(event.target.checked ? open(proposals) : []))}
                    />
                  </th>
                  <th scope="col">Ship</th>
                  <th scope="col">When</th>
                  <th scope="col">Trainer</th>
                  <th scope="col">Travel</th>
                  <th scope="col">Cost</th>
                  <th scope="col">Why</th>
                  <th scope="col">
                    <span className="sr-only">Change</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((row) => (
                  <Fragment key={row.index}>
                  <tr>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Accept session for ${row.ship}`}
                        disabled={row.status?.status === "accepted"}
                        checked={pickedProposals.has(row.index)}
                        onChange={() => setPickedProposals((set) => toggle(set, row.index))}
                      />
                    </td>
                    <td>{row.ship}</td>
                    <td>{row.when}</td>
                    <td>{row.trainer}</td>
                    <td>{row.travel}</td>
                    <td>{row.cost}</td>
                    <td>
                      {row.reason} <Status status={row.status} />
                    </td>
                    <td>
                      {row.status?.status !== "accepted" && (
                        <button
                          type="button"
                          className="training-planner__edit-button"
                          aria-expanded={editing === row.index}
                          aria-label={`Edit session for ${row.ship}`}
                          onClick={() => setEditing(editing === row.index ? null : row.index)}
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                  {editing === row.index && (
                    <tr>
                      <td colSpan={8}>
                        <TrainingPlannerEdit
                          index={row.index}
                          ship={row.ship}
                          values={row.values}
                          cruises={cruises[row.shipName] ?? []}
                          trainers={trainers}
                          onClose={() => setEditing(null)}
                        />
                      </td>
                    </tr>
                  )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="training-form__submit">
        <Button type="button" buttonStyle="primary" disabled={busy || count === 0} onClick={accept}>
          {busy ? "Saving…" : `Accept selected (${count})`}
        </Button>
        <p className="training-form__check">Ticked moves are applied first, then ticked sessions are added. Each is checked for conflicts again.</p>
      </div>
      {error && (
        <div className="training-form__error" role="alert">
          <p>{error}</p>
        </div>
      )}
    </>
  );
}
