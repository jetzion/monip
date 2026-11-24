"use client";

import { Button } from "@payloadcms/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  /** Cruise lines in order, each with its ships. */
  cruiseLines: { name: string; ships: string[] }[];
  ports: string[];
  initialShips: string[];
  initialPorts: string[];
};

const toggle = (set: Set<string>, value: string) => {
  const next = new Set(set);
  if (!next.delete(value)) next.add(value);
  return next;
};

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

/** "2 ships and 1 port preferred", or "None preferred: all ships and ports are offered". */
const summary = (ships: number, ports: number) =>
  ships + ports === 0
    ? "None preferred: Schedule training offers all ships and ports."
    : `${plural(ships, "ship")} and ${plural(ports, "port")} preferred.`;

/** "3 preferred" as a badge; screen readers hear "(3 preferred)" as part of the heading instead. */
function CountBadge({ count }: { count: number }) {
  return (
    <>
      <span className={count ? "count-badge count-badge--on" : "count-badge"} aria-hidden="true">
        {count} preferred
      </span>
      <span className="count-badge__text">({count} preferred)</span>
    </>
  );
}

/** How many of a group's options are ticked, shown only when any are. */
function GroupCount({ ticked }: { ticked: number }) {
  return ticked ? <span className="training-preferences__ticked">{ticked} ticked</span> : null;
}

/** Checkboxes for preferred ships (grouped by cruise line) and start ports, with Save. */
export function TrainingPreferencesForm({ cruiseLines, ports, initialShips, initialPorts }: Props) {
  const router = useRouter();
  const [ships, setShips] = useState(new Set(initialShips));
  const [chosenPorts, setPorts] = useState(new Set(initialPorts));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/globals/training-preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ships: [...ships].sort(), ports: [...chosenPorts].sort() }),
    }).catch(() => null);
    setBusy(false);
    if (!response?.ok) return setMessage("The preferences could not be saved. Try again.");
    setMessage("Preferences saved.");
    router.refresh();
  }

  return (
    <div className="training-preferences">
      <div className="training-preferences__columns">
        <section aria-labelledby="preferences-ships-title">
          <h2 id="preferences-ships-title">
            Ships <CountBadge count={ships.size} />
          </h2>
          {cruiseLines.map((line) => (
            <fieldset key={line.name} className="training-preferences__group">
              <legend>
                {line.name}{" "}
                <GroupCount ticked={line.ships.filter((ship) => ships.has(ship)).length} />
              </legend>
              {line.ships.map((ship) => (
                <label key={ship} className="training-preferences__option">
                  <input type="checkbox" checked={ships.has(ship)} onChange={() => setShips(toggle(ships, ship))} /> {ship}
                </label>
              ))}
            </fieldset>
          ))}
        </section>
        <section aria-labelledby="preferences-ports-title">
          <h2 id="preferences-ports-title">
            Start ports <CountBadge count={chosenPorts.size} />
          </h2>
          <fieldset className="training-preferences__group">
            <legend>
              Ports{" "}
              <GroupCount ticked={chosenPorts.size} />
            </legend>
            {ports.map((port) => (
              <label key={port} className="training-preferences__option">
                <input type="checkbox" checked={chosenPorts.has(port)} onChange={() => setPorts(toggle(chosenPorts, port))} />{" "}
                {port}
              </label>
            ))}
          </fieldset>
        </section>
      </div>
      <div className="training-preferences__actions">
        <Button type="button" buttonStyle="primary" disabled={busy} onClick={save}>
          {busy ? "Saving…" : "Save preferences"}
        </Button>
        <p className="training-preferences__summary">{summary(ships.size, chosenPorts.size)}</p>
        <p role="status">{message}</p>
      </div>
    </div>
  );
}
