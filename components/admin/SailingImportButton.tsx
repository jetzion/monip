"use client";

import { Button } from "@payloadcms/ui";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import type { ImportSummary } from "@/lib/sailings/import";

const SHOWN_REJECTIONS = 20;

type State =
  | { status: "idle" }
  | { status: "importing"; fileName: string }
  | { status: "done"; fileName: string; summary: ImportSummary }
  | { status: "failed"; error: string };

/**
 * Uploads a filled-in template to the import endpoint, shows the summary
 * and any rejected rows, then refreshes the list and filter options.
 */
export function SailingImportButton({ endpoint }: { endpoint: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<State>({ status: "idle" });

  const upload = async (file: File) => {
    setState({ status: "importing", fileName: file.name });
    const body = new FormData();
    body.append("file", file);
    const response = await fetch(endpoint, { method: "POST", body }).catch(() => null);
    const result = await response?.json().catch(() => null);
    if (!response?.ok) {
      setState({ status: "failed", error: result?.error ?? "The import failed. Check your connection and try again." });
      return;
    }
    setState({ status: "done", fileName: file.name, summary: result as ImportSummary });
    router.refresh();
  };

  return (
    <div className="sailing-import">
      <input
        ref={input}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void upload(file);
        }}
      />
      <Button
        buttonStyle="primary"
        size="medium"
        disabled={state.status === "importing"}
        onClick={() => input.current?.click()}
      >
        Import Excel
      </Button>
      <div role="status" className="sailing-import__result">
        {state.status === "importing" && <p>Importing {state.fileName}… This can take up to a minute.</p>}
        {state.status === "failed" && <p className="sailing-import__error">{state.error}</p>}
        {state.status === "done" && <ImportResult fileName={state.fileName} summary={state.summary} />}
      </div>
    </div>
  );
}

function ImportResult({ fileName, summary }: { fileName: string; summary: ImportSummary }) {
  const { inserted, updated, unchanged, rejected } = summary;
  return (
    <>
      <p>
        Imported {fileName}: {inserted} added, {updated} updated, {unchanged} unchanged, {rejected.length} rejected.
      </p>
      {rejected.length > 0 && (
        <ul>
          {rejected.slice(0, SHOWN_REJECTIONS).map(({ row, reason }) => (
            <li key={row}>
              Row {row}: {reason}
            </li>
          ))}
          {rejected.length > SHOWN_REJECTIONS && <li>…and {rejected.length - SHOWN_REJECTIONS} more rows.</li>}
        </ul>
      )}
    </>
  );
}
