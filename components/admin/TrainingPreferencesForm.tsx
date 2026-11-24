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
            Ships ({ships.size} preferred)
          </h2>
          {cruiseLines.map((line) => (
            <fieldset key={line.name} className="training-preferences__group">
              <legend>{line.name}</legend>
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
            Start ports ({chosenPorts.size} preferred)
          </h2>
          <fieldset className="training-preferences__group">
            <legend>Ports</legend>
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
        <p role="status">{message}</p>
      </div>
    </div>
  );
}
