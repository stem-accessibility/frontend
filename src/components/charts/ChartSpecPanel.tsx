// Upload a Vega-Lite chart specification. The specification supplies the chart's structure,
// and its data comes from the file itself or from the CSV that is already loaded.
import React, { useId, useState } from "react";
import type { ParsedDataset } from "../../types/types";
import type { LoadedSpec } from "../../olli/vegaLiteSpec";

// Defined here, not imported, so vegaLiteSpec.ts stays a purely on-demand chunk.
const MAX_SPEC_BYTES = 2 * 1024 * 1024;

interface Props {
  dataset: ParsedDataset | null;
  /** The file name of the specification currently in use, if any. */
  activeName: string | null;
  onLoaded: (spec: LoadedSpec, fileName: string) => void;
  onCleared: () => void;
}

type Status = { kind: "ok" | "error"; text: string } | null;

export function ChartSpecPanel({ dataset, activeName, onLoaded, onCleared }: Props) {
  const inputId = useId();
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > MAX_SPEC_BYTES) {
      setStatus({ kind: "error", text: `${file.name} is larger than ${MAX_SPEC_BYTES / 1024 / 1024} MB, which is more than a chart specification should be.` });
      input.value = "";
      return;
    }

    setBusy(true);
    setStatus(null);
    try {
      const text = await file.text();
      // Imported here so the module (and vega-lite behind it) loads only when someone uploads a spec.
      const { loadVegaLiteSpec } = await import("../../olli/vegaLiteSpec");
      const result = await loadVegaLiteSpec(text, file.name, dataset);
      if ("error" in result) {
        setStatus({ kind: "error", text: `${file.name}: ${result.error}` });
      } else {
        setStatus({
          kind: "ok",
          text: result.usedUploadedData
            ? `Loaded ${file.name} and applied it to ${dataset?.name ?? "the uploaded data"}.`
            : `Loaded ${file.name}.`,
        });
        onLoaded(result, file.name);
      }
    } catch (err) {
      setStatus({ kind: "error", text: `Could not read ${file.name}: ${err instanceof Error ? err.message : String(err)}` });
    } finally {
      setBusy(false);
      input.value = "";
    }
  };

  return (
    <section className="card" aria-labelledby={`${inputId}-h`}>
      <h2 id={`${inputId}-h`}>Chart specification (optional)</h2>
      <label htmlFor={inputId}>Choose a Vega-Lite JSON file</label>{" "}
      <input id={inputId} type="file" accept=".json,application/json" onChange={handleFile} disabled={busy} />
      <p className="hint">
        Describes the chart from a Vega-Lite specification instead of the column mapping. If the specification
        does not contain its data, upload the CSV first and it is applied to that. Data is never fetched from
        web addresses in the file.
      </p>

      {activeName && (
        <p>
          Using <strong>{activeName}</strong>.{" "}
          <button type="button" onClick={() => { setStatus(null); onCleared(); }}>
            Remove specification
          </button>
        </p>
      )}

      <p
        role={status?.kind === "error" ? "alert" : "status"}
        className={status?.kind === "error" ? "error-banner" : "hint"}
      >
        {busy ? "Reading specification…" : status?.text ?? ""}
      </p>
    </section>
  );
}
