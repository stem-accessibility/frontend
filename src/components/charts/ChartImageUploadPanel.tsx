// src/components/charts/ChartImageUploadPanel.tsx
// Read a chart image into a table. The AI model (Gemini, through OpenRouter) is used only when
// the person has chosen it; the built-in reader keeps the image on our servers.
import { useEffect, useId, useState } from "react";
import type { ParsedDataset } from "../../types/types";
import { apiFetch, apiUpload, publicFetch } from "../../lib/api";
import { guestFetch } from "../../lib/guest";
import {
  extractionPolicy,
  requestPlan,
  type ExtractionChoice,
  type ExtractionOptions,
} from "./chartExtractionPolicy";

export interface ChartExtractionResult {
  dataset: { columns: string[]; rows: Record<string, string | number | null>[]; name?: string | null };
  config: {
    preset?: string | null;
    title?: string | null;
    xLabel?: string | null;
    yLabel?: string | null;
  };
  spec: Record<string, unknown> | null;
  extractor: "unichart" | "llm";
  sent_to_ai_model: boolean;
  values_are_estimated: boolean;
  warnings: string[];
}

interface Props {
  signedIn: boolean;
  onExtracted: (data: ParsedDataset, result: ChartExtractionResult) => void;
}

type Options = ExtractionOptions;
type Choice = ExtractionChoice;
type Status = { kind: "info" | "ok" | "error"; text: string } | null;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitForJob(jobId: number): Promise<ChartExtractionResult> {
  for (let i = 0; i < 120; i++) {
    const job = await apiFetch<{
      status: "queued" | "running" | "done" | "failed";
      result: ChartExtractionResult | null;
      error: string | null;
    }>(`/jobs/${jobId}`);
    if (job.status === "done" && job.result) return job.result;
    if (job.status === "failed") throw new Error(job.error || "The chart could not be read.");
    await sleep(1500);
  }
  throw new Error("Reading the chart took too long. Please try again.");
}

function messageOf(e: unknown, fallback: string) {
  // apiFetch errors look like "400 BAD REQUEST: <server message>"; show only the message.
  const raw = e instanceof Error ? e.message : "";
  return raw.replace(/^\d{3}[^:]*:\s*/, "") || fallback;
}

export function ChartImageUploadPanel({ signedIn, onExtracted }: Props) {
  const id = useId();
  const [options, setOptions] = useState<Options | "unavailable" | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [choice, setChoice] = useState<Choice>("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    publicFetch<Options>("/chart-extraction/options")
      .then((o) => !cancelled && setOptions(o))
      .catch(() => !cancelled && setOptions("unavailable"));
    return () => {
      cancelled = true;
    };
  }, []);

  // What this person may use. Guests only ever get the built-in reader (the server enforces it).
  const known = options && options !== "unavailable" ? options : null;
  // A choice is needed only when the AI model is on offer.
  const { useLocal, offerAi, nothing, needsChoice, choiceMade, allowAi, canRead } = extractionPolicy({
    signedIn,
    options: known,
    choice,
    hasFile: !!file,
    busy,
  });

  async function read() {
    if (!file || !canRead) return;
    setBusy(true);
    setWarnings([]);
    setStatus({ kind: "info", text: "Reading the chart. This can take a few seconds." });
    try {
      const form = new FormData();
      form.append("file", file);
      let result: ChartExtractionResult;
      const plan = requestPlan(signedIn, allowAi);
      if (plan.allowLlmField !== null) form.append("allow_llm", plan.allowLlmField);
      if (signedIn) {
        const job = await apiUpload<{ job_id: number }>(plan.endpoint, form);
        result = await waitForJob(job.job_id);
      } else {
        result = await guestFetch<ChartExtractionResult>(plan.endpoint, {
          method: "POST",
          body: form,
        });
      }
      const rows = result.dataset.rows.length;
      const cols = result.dataset.columns.length;
      setWarnings(result.warnings);
      setStatus({
        kind: "ok",
        text:
          `Read ${rows} ${rows === 1 ? "row" : "rows"} and ${cols} ${cols === 1 ? "column" : "columns"} ` +
          (result.sent_to_ai_model
            ? "using the AI model (the image was sent to Google's Gemini model through OpenRouter)."
            : "with the built-in reader (the image was not sent to a third party)."),
      });
      onExtracted(
        { columns: result.dataset.columns, rows: result.dataset.rows, name: file.name } as ParsedDataset,
        result
      );
    } catch (e) {
      setStatus({ kind: "error", text: messageOf(e, "The chart could not be read. Try a CSV instead.") });
    } finally {
      setBusy(false);
    }
  }

  const fileId = `${id}-file`;
  const noticeId = `${id}-notice`;
  const choiceName = `${id}-choice`;

  return (
    <section className="card" aria-labelledby={`${id}-heading`} aria-busy={busy}>
      <h2 id={`${id}-heading`}>Read a chart image</h2>

      {options === null && <p role="status">Checking what is available…</p>}

      {nothing && options !== null && (
        <p className="hint">
          {signedIn
            ? "Reading chart images is not available right now. Upload a CSV instead."
            : "Reading chart images needs the built-in reader, which is not available right now. Upload a CSV instead."}
        </p>
      )}

      {!nothing && (
        <>
          <label htmlFor={fileId}>Choose a chart image (PNG, JPEG or WebP)</label>{" "}
          <input
            id={fileId}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={busy}
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setStatus(null);
            }}
          />

          {offerAi ? (
            <fieldset disabled={busy}>
              <legend>How should this chart be read?</legend>
              <p id={noticeId} className="hint">
                The AI model is Google&rsquo;s Gemini, reached through OpenRouter. Choosing it sends your
                image to those services. It leaves our servers and may be logged or kept by them, so it
                may not be private. Do not use it for an image with personal or confidential information.
              </p>
              {useLocal && (
                <label style={{ display: "block" }}>
                  <input
                    type="radio"
                    name={choiceName}
                    value="local"
                    checked={choice === "local"}
                    onChange={() => setChoice("local")}
                    aria-describedby={noticeId}
                  />{" "}
                  Built-in reader only. The image stays on our servers. Charts with several series may be
                  read incompletely.
                </label>
              )}
              <label style={{ display: "block" }}>
                <input
                  type="radio"
                  name={choiceName}
                  value="ai"
                  checked={choice === "ai"}
                  onChange={() => setChoice("ai")}
                  aria-describedby={noticeId}
                />{" "}
                {useLocal
                  ? "Built-in reader, and the AI model when the built-in reader is not sure. The image may be sent to Gemini."
                  : "Use the AI model. The image is sent to Gemini."}
              </label>
              {!useLocal && (
                <label style={{ display: "block" }}>
                  <input
                    type="radio"
                    name={choiceName}
                    value="none"
                    checked={choice === "none"}
                    onChange={() => setChoice("none")}
                    aria-describedby={noticeId}
                  />{" "}
                  Do not use the AI model. I will enter the data as a CSV instead.
                </label>
              )}
            </fieldset>
          ) : (
            <p className="hint">
              {signedIn
                ? "This chart is read with the built-in reader. The image is not sent to a third party."
                : "This chart is read with the built-in reader. The image is not sent to a third party or kept."}
            </p>
          )}

          {choice === "none" && (
            <p className="hint">Use the CSV upload below to enter this chart&rsquo;s data.</p>
          )}

          <p>
            <button type="button" onClick={read} disabled={!canRead || choice === "none"}>
              {busy ? "Reading…" : "Read chart"}
            </button>
          </p>
          {!file && !busy && <p className="hint">Choose an image to continue.</p>}
          {file && needsChoice && !choiceMade && (
            <p className="hint">Choose how to read the chart to continue.</p>
          )}
        </>
      )}

      {/* Polite for progress and success, assertive for errors, so the outcome is announced. */}
      <p
        role={status?.kind === "error" ? "alert" : "status"}
        className={status?.kind === "error" ? "error-banner" : "hint"}
      >
        {status?.text ?? ""}
      </p>

      {warnings.length > 0 && (
        <>
          <h3>Check this</h3>
          <ul>
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
