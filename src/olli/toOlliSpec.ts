// Turns the Charts page state (CSV rows + chosen columns + preset) into an Olli spec.
// Pure and framework-free so it can be unit tested. The mark follows what VisualChart draws,
// so the navigable description matches the picture.
import type { OlliVisSpec, OlliDatum, OlliMarkType } from "olli";
import type { SonificationPresetId } from "../types/types";

export type ChartRow = Record<string, string | number | null | undefined>;

export type ToOlliSpecInput = {
  rows: ChartRow[];
  /** Column on the x axis. "__index" (or empty) means row position, starting at 1. */
  xField: string | null | undefined;
  yField: string | null | undefined;
  preset: SonificationPresetId;
  title?: string;
  /** Axis titles chosen by the author; the column names are used when these are blank. */
  xLabel?: string;
  yLabel?: string;
};

const MARK_FOR_PRESET: Record<SonificationPresetId, OlliMarkType> = {
  line: "line",
  bar: "bar",
  histogram: "bar",
  pie: "bar", // VisualChart draws pies as bars
  boxplot: "line", // VisualChart draws boxplots as a line
  scatter_spatial: "point",
  scatter_temporal: "point",
};

/** Most distinct numeric x values still listed one by one rather than binned. */
const MAX_LISTED_POINTS = 30;

const isBlank = (v: unknown) => v === null || v === undefined || String(v).trim() === "";

function asNumber(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Returns null when there is nothing meaningful to describe yet. */
export function toOlliSpec({ rows, xField, yField, preset, title, xLabel, yLabel }: ToOlliSpecInput): OlliVisSpec | null {
  if (!yField || rows.length === 0) return null;

  // A stale or missing x column (for example a leftover "time" after loading category data)
  // falls back to row position rather than producing an empty chart.
  const xInData = !!xField && rows.some((r) => xField in r && !isBlank(r[xField]));
  const useIndex = !xField || xField === "__index" || !xInData;
  const xName = useIndex ? "Row" : (xField as string);

  // Keep only rows that have a usable y value (Olli values cannot be null).
  const usable: { x: string | number; y: number }[] = [];
  rows.forEach((row, i) => {
    const y = asNumber(row[yField]);
    if (y === null) return;
    if (useIndex) {
      usable.push({ x: i + 1, y });
      return;
    }
    const rawX = row[xField as string];
    if (isBlank(rawX)) return;
    const nx = asNumber(rawX);
    usable.push({ x: nx !== null ? nx : String(rawX).trim(), y });
  });
  if (usable.length === 0) return null;

  const xIsNumeric = usable.every((d) => typeof d.x === "number");
  const data: OlliDatum[] = usable.map((d) => ({ [xName]: d.x, [yField]: d.y }));
  const mark = MARK_FOR_PRESET[preset];

  // Olli bins a quantitative x axis into ranges ("x is between 10 and 15"). That suits a
  // scatterplot or a long series, but a short series reads better one point at a time, so
  // numeric x values with few distinct values are listed individually, in numeric order.
  const distinctX = [...new Set(usable.map((d) => d.x))];
  const listEach = xIsNumeric && mark !== "point" && distinctX.length <= MAX_LISTED_POINTS;
  const asOrdinal = !xIsNumeric || listEach;

  // Categories keep the order they appear in the file (Olli would otherwise sort them
  // alphabetically, so "Jan, Feb, Mar" would read "Feb, Jan, Mar").
  const ticks = !asOrdinal
    ? undefined
    : xIsNumeric
      ? ([...distinctX] as number[]).sort((a, b) => a - b)
      : distinctX.map(String);

  return {
    title: title ?? `${yLabel ?? yField} by ${xLabel ?? xName}`,
    mark,
    data,
    fields: [
      { field: xName, type: asOrdinal ? "ordinal" : "quantitative" },
      { field: yField, type: "quantitative" },
    ],
    axes: [
      { axisType: "x", field: xName, title: xLabel ?? xName, ...(ticks ? { ticks } : {}) },
      { axisType: "y", field: yField, title: yLabel ?? yField },
    ],
  };
}
