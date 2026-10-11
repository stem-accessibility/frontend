import type { ChartType } from "../types/vizIR";

export function buildVegaLiteSpec(args: {
  chartType: ChartType;                 // "bar" | "line"
  rows: Record<string, any>[];          // your parsed CSV rows
  xField: string;
  yField: string;
  aggregate: "sum" | "avg" | "count" | "none";
}) {
  const { chartType, rows, xField, yField, aggregate } = args;

  const vlAgg =
    aggregate === "none" ? undefined : aggregate; // Vega-Lite accepts "sum" | "average" (see below)

  // Normalize average spelling
  const normalizeAgg = (a?: string) => {
    if (!a) return undefined;
    if (a === "avg") return "average";
    return a;
  };

  const agg = normalizeAgg(vlAgg);

  // Minimal schema + inline data values
  const spec: any = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    data: { values: rows },
    mark: chartType === "bar" ? "bar" : "line",
    encoding: {
      x: {
        field: xField,
        type: chartType === "line" ? "temporal" : "nominal",
      },
      y: {
        field: yField,
        type: "quantitative",
        ...(agg ? { aggregate: agg } : {}),
      },

      // TVL uses "texture" and internally maps to color and patterns.
      // For now: a single texture everywhere is fine (warnings are ok).
      texture: {
        scale: { range: ["solidGrayFill"] },
      },
    },
  };

  return spec;
}
