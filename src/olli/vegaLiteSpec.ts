// Loads an uploaded Vega-Lite spec for Olli. The pure helpers here do not touch vega-lite or
// the DOM so they can be unit tested; loadVegaLiteSpec lazy-loads Olli's adapter (and with it
// vega-lite) only when a spec is actually uploaded.
import type { OlliVisSpec } from "olli";
import type { ParsedDataset, ParsedRow } from "../types/types";
import { MAX_CSV_ROWS } from "../services/csvParse";

type Json = Record<string, unknown>;
const isObject = (v: unknown): v is Json => typeof v === "object" && v !== null && !Array.isArray(v);

const VIEW_KEYS = ["mark", "layer", "hconcat", "vconcat", "concat", "facet", "repeat", "spec"];

export type SpecError = { error: string };

export function parseSpecText(text: string): { spec: Json } | SpecError {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { error: "This file is not valid JSON." };
  }
  if (!isObject(parsed)) return { error: "A chart specification must be a JSON object." };

  const schema = typeof parsed.$schema === "string" ? parsed.$schema : "";
  if (schema && !/vega-lite/i.test(schema)) {
    return { error: "Only Vega-Lite specifications are supported. This file declares a different schema." };
  }
  if (!VIEW_KEYS.some((k) => k in parsed)) {
    return { error: "This does not look like a Vega-Lite specification: it has no mark, layer or view definition." };
  }
  return { spec: parsed };
}

/** Does this `data` value (or nested ones) point outside the file? */
function externalIn(node: unknown, datasets: Json, top: boolean): string | null {
  if (Array.isArray(node)) {
    for (const n of node) {
      const hit = externalIn(n, datasets, false);
      if (hit) return hit;
    }
    return null;
  }
  if (!isObject(node)) return null;
  for (const [k, v] of Object.entries(node)) {
    if (k === "data" && isObject(v)) {
      if (typeof v.url === "string") return top ? "top" : `its data is loaded from ${v.url}`;
      if (typeof v.name === "string" && !(v.name in datasets)) {
        if (!top) return `it refers to a dataset named "${v.name}" that the file does not contain`;
        return "top";
      }
    }
    const hit = externalIn(v, datasets, false);
    if (hit) return hit;
  }
  return null;
}

export type DataPlan =
  | { kind: "inline" }
  | { kind: "needs-rows" } // top-level data is missing or external; rows must come from the CSV
  | { kind: "unsupported"; reason: string };

export function planData(spec: Json): DataPlan {
  const datasets = isObject(spec.datasets) ? spec.datasets : {};
  const data = spec.data;

  // Anything below the top level that points outside the file is not something we will fetch.
  const nested = externalIn(
    Object.fromEntries(Object.entries(spec).filter(([k]) => k !== "data")),
    datasets,
    false
  );
  if (nested) return { kind: "unsupported", reason: `This specification cannot be used because ${nested}.` };

  if (isObject(data)) {
    if (Array.isArray(data.values)) return { kind: "inline" };
    if (typeof data.name === "string" && data.name in datasets) return { kind: "inline" };
  }
  return { kind: "needs-rows" };
}

/** Tabular rows (an array of plain objects) from the spec's own data, if it has any. */
export function inlineRows(spec: Json): Json[] | null {
  const datasets = isObject(spec.datasets) ? spec.datasets : {};
  const data = spec.data;
  let values: unknown;
  if (isObject(data)) {
    values = Array.isArray(data.values) ? data.values : typeof data.name === "string" ? datasets[data.name] : undefined;
  }
  if (!Array.isArray(values) || values.length === 0) return null;
  return values.every(isObject) ? (values as Json[]) : null;
}

const cell = (v: unknown): string | number | null => {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "string") return v;
  return JSON.stringify(v); // nested objects and arrays: show them as text rather than "[object Object]"
};

export function rowsToDataset(rows: Json[], name: string): ParsedDataset {
  const columns: string[] = [];
  for (const r of rows.slice(0, 200)) {
    for (const k of Object.keys(r)) if (!columns.includes(k)) columns.push(k);
  }
  const parsed: ParsedRow[] = rows.slice(0, MAX_CSV_ROWS).map((r) =>
    Object.fromEntries(columns.map((c) => [c, cell(r[c])])) as ParsedRow
  );
  return { columns, rows: parsed, name };
}

/** A Vega-Lite title is either a string or an object with a `text` string (or array of lines). */
export function specTitle(spec: Json): string | undefined {
  const t = spec.title;
  if (typeof t === "string") return t.trim() || undefined;
  if (isObject(t)) {
    const text = Array.isArray(t.text) ? t.text.join(" ") : t.text;
    if (typeof text === "string") return text.trim() || undefined;
  }
  return undefined;
}

/**
 * The copy of a specification that is saved with a shared chart. A top-level `data.url` is dropped:
 * the rows come from the chart's own table, and the server refuses any `url` it is sent. Nested
 * urls never get here because planData already rejects them.
 */
export function specForStorage(spec: Json): Json {
  const data = spec.data;
  if (isObject(data) && typeof data.url === "string") {
    const rest = { ...spec };
    delete rest.data;
    return rest;
  }
  return spec;
}

export type LoadedSpec = {
  olli: OlliVisSpec;
  /** The specification to save with a shared chart (see specForStorage). */
  source: Record<string, unknown>;
  /** The specification's own title, used to name the saved chart. */
  title?: string;
  /** Data for the table and sonification: the spec's own, or the uploaded CSV it was applied to. */
  dataset: ParsedDataset | null;
  /** True when the spec had no usable data of its own and the uploaded CSV was applied to it. */
  usedUploadedData: boolean;
};

export async function loadVegaLiteSpec(
  text: string,
  fileName: string,
  uploaded: ParsedDataset | null
): Promise<LoadedSpec | SpecError> {
  const parsed = parseSpecText(text);
  if ("error" in parsed) return parsed;
  const { spec } = parsed;

  const plan = planData(spec);
  if (plan.kind === "unsupported") return { error: plan.reason };

  let toRun: Json = spec;
  let dataset: ParsedDataset | null = null;
  let usedUploadedData = false;

  if (plan.kind === "needs-rows") {
    if (!uploaded || uploaded.rows.length === 0) {
      return {
        error:
          "This specification does not include its data. Upload the CSV it describes first, then upload the specification again.",
      };
    }
    toRun = { ...spec, data: { values: uploaded.rows } };
    dataset = uploaded;
    usedUploadedData = true;
  } else {
    const rows = inlineRows(spec);
    dataset = rows ? rowsToDataset(rows, fileName) : null;
  }

  try {
    // Loaded on demand: vega-lite is large and most visitors never upload a specification.
    const { VegaLiteAdapter } = await import("olli/adapters");
    const olli = (await VegaLiteAdapter(toRun)) as OlliVisSpec;
    // The adapter does not carry the specification's own title over; without it the outline opens
    // with "A bar chart, with axes…" and never names what the chart is about.
    const title = specTitle(spec);
    if (title && !("operator" in olli) && !olli.title) olli.title = title;
    return { olli, source: specForStorage(spec), title, dataset, usedUploadedData };
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return { error: `This specification could not be read: ${detail}` };
  }
}
