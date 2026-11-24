"use client";

import Image from "next/image";

import { estimateTotal, usd, type EstimateItem, type EstimateLine, type FoundPrices } from "@/lib/training/estimate";
import type { EstimateState } from "@/lib/training/form";
import { travelData, type Travel } from "@/lib/training/travel";

/** Asks the server to look up the trip's prices online (about a minute). */
export async function lookUpTripPrices(travel: Travel, port: string): Promise<Pick<EstimateState, "lookup" | "found" | "message">> {
  const response = await fetch("/api/training-sessions/estimate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ travel: travelData(travel), port }),
  }).catch(() => null);
  const body = (await response?.json().catch(() => null)) as { prices?: FoundPrices; error?: string } | null;
  if (response?.ok && body?.prices) {
    const missing = Object.keys(body.prices).length === 0;
    return { lookup: "done", found: body.prices, message: missing ? "No prices were found online. The estimate uses the rates." : undefined };
  }
  return { lookup: "failed", found: {}, message: body?.error ?? "Prices could not be found online. Use the rates or enter the amounts." };
}

type Props = {
  state: EstimateState;
  lines: EstimateLine[];
  onAmount: (item: EstimateItem, amount: number | null) => void;
  onAcknowledge: (acknowledged: boolean) => void;
};

/** The travel cost estimate: the lookup's progress, editable amounts with their sources, the total, and the acknowledgement. */
export function TrainingEstimate({ state, lines, onAmount, onAcknowledge }: Props) {
  if (state.lookup === "loading") {
    // Fixed at the top center of the Training Schedule while the lookup runs.
    return (
      <div role="status" className="training-estimate__searching">
        <Image src="/searching-icon.svg" alt="" width={64} height={64} unoptimized priority />
        <p className="training-estimate__status">Looking up current prices online. This takes about a minute.</p>
      </div>
    );
  }
  const total = estimateTotal(lines);
  return (
    <div className="training-estimate">
      {state.message && (
        <p role="status" className="training-estimate__status">
          {state.message}
        </p>
      )}
      {lines.length === 0 ? (
        <p>No travel costs: no flight, hotel, car rental, or rideshare is needed.</p>
      ) : (
        <table className="training-estimate__table">
          <caption>Estimated travel cost (US dollars)</caption>
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col">Details</th>
              <th scope="col">Price from</th>
              <th scope="col">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.item}>
                <th scope="row">{line.label}</th>
                <td>{line.detail}</td>
                <td>
                  {line.url ? (
                    <a href={line.url} target="_blank" rel="noopener noreferrer">
                      {line.source}
                    </a>
                  ) : (
                    line.source
                  )}
                  {line.note && <span className="training-estimate__note">{line.note}</span>}
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    aria-label={`${line.label} amount`}
                    className="training-estimate__amount"
                    value={line.amount ?? ""}
                    onChange={(event) => onAmount(line.item, event.target.value === "" ? null : Math.max(0, Number(event.target.value)))}
                  />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={3}>
                Total
              </th>
              <td>{total == null ? "Enter every amount" : usd(total)}</td>
            </tr>
          </tfoot>
        </table>
      )}
      <label className="training-travel__choice">
        <input type="checkbox" checked={state.acknowledged} disabled={total == null} onChange={(event) => onAcknowledge(event.target.checked)} /> I
        acknowledge the estimated travel cost{total == null ? "" : ` of ${usd(total)}`}
      </label>
    </div>
  );
}
