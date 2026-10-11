import type { Row } from "./parseCsv";

export type Aggregate = "sum" | "avg" | "count" | "none";

export type BarDatum = { x: string; y: number };
export type LineDatum = { x: Date; y: number };

export type ChartData =
  | { kind: "bar"; items: BarDatum[] }
  | { kind: "line"; items: LineDatum[] };

function toNumber(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function toDate(v: unknown): Date | null {
  if (v == null || v === "") return null;
  const d = v instanceof Date ? v : new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Compute aggregated series from raw rows based on selected fields.
 * MVP behavior:
 * - bar: group by x (string), aggregate y
 * - line: group by x date (day-level key), aggregate y, sorted by date
 */
export function computeSeries(args: {
  rows: Row[];
  chartType: "bar" | "line";
  xField: string;
  yField: string;
  aggregate: Aggregate;
}): ChartData {
  const { rows, chartType, xField, yField, aggregate } = args;

  if (chartType === "bar") {
    // group by x
    const buckets = new Map<string, { sum: number; count: number }>();

    for (const r of rows) {
      const xRaw = r[xField];
      const x = xRaw == null || xRaw === "" ? "(missing)" : String(xRaw);

      // count-only chart
      if (aggregate === "count") {
        const cur = buckets.get(x) ?? { sum: 0, count: 0 };
        cur.count += 1;
        buckets.set(x, cur);
        continue;
      }

      // y-based aggregations
      const yNum = toNumber(r[yField]);
      if (yNum == null) continue;

      const cur = buckets.get(x) ?? { sum: 0, count: 0 };
      cur.sum += yNum;
      cur.count += 1;
      buckets.set(x, cur);
    }

    let items: BarDatum[] = Array.from(buckets.entries()).map(([x, v]) => {
      let y = 0;
      if (aggregate === "avg") y = v.count ? v.sum / v.count : 0;
      else if (aggregate === "none") y = v.count ? v.sum / v.count : 0; // treat as avg for grouped data
      else if (aggregate === "sum") y = v.sum;
      else if (aggregate === "count") y = v.count;
      return { x, y };
    });

    // Stable default sort: desc by value
    items = items.sort((a, b) => b.y - a.y);

    return { kind: "bar", items };
  }

  // line
  const buckets = new Map<string, { date: Date; sum: number; count: number }>();

  for (const r of rows) {
    const d = toDate(r[xField]);
    if (!d) continue;

    // day-level key for grouping (MVP)
    const key = d.toISOString().slice(0, 10);

    if (aggregate === "count") {
      const cur = buckets.get(key) ?? { date: d, sum: 0, count: 0 };
      cur.count += 1;
      buckets.set(key, cur);
      continue;
    }

    const yNum = toNumber(r[yField]);
    if (yNum == null) continue;

    const cur = buckets.get(key) ?? { date: d, sum: 0, count: 0 };
    cur.sum += yNum;
    cur.count += 1;
    // keep earliest parsed date for that key
    if (d < cur.date) cur.date = d;
    buckets.set(key, cur);
  }

  const items: LineDatum[] = Array.from(buckets.values())
    .map((v) => {
      let y = 0;
      if (aggregate === "avg") y = v.count ? v.sum / v.count : 0;
      else if (aggregate === "none") y = v.count ? v.sum / v.count : 0;
      else if (aggregate === "sum") y = v.sum;
      else if (aggregate === "count") y = v.count;
      return { x: v.date, y };
    })
    .sort((a, b) => a.x.getTime() - b.x.getTime());

  return { kind: "line", items };
}
