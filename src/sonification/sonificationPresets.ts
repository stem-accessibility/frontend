// src/sonification/sonificationPresets.ts
import type { ParsedDataset, SonificationPresetId } from "../types/types";

export type ChartType = "line" | "bar" | "scatter";

export interface SonificationPreset {
  id: SonificationPresetId;
  label: string;
  chartType: ChartType;
  description: string;
  exampleDataset: ParsedDataset;
  defaultConfig: {
    timeColumn: string | null;
    valueColumn: string | null;
  };
}

// Small helper to make example datasets
function makeDataset(
  name: string,
  columns: string[],
  rows: Record<string, any>[]
): ParsedDataset {
  return { name, columns, rows };
}

export const SONIFICATION_PRESETS: Record<SonificationPresetId, SonificationPreset> = {
  line: {
    id: "line",
    label: "Line (time series)",
    chartType: "line",
    description: "One numeric value over time or index (e.g., CPU usage, stock price).",
    exampleDataset: makeDataset("line-example.csv", ["time", "value"], [
      { time: 0, value: 10 },
      { time: 1, value: 20 },
      { time: 2, value: 15 },
      { time: 3, value: 30 },
      { time: 4, value: 25 },
      { time: 5, value: 40 },
      { time: 6, value: 35 },
      { time: 7, value: 50 },
    ]),
    defaultConfig: {
      timeColumn: "time",
      valueColumn: "value",
    },
  },

  bar: {
    id: "bar",
    label: "Bar (categories)",
    chartType: "bar",
    description: "Categories with a single numeric value (e.g., sales per region).",
    exampleDataset: makeDataset("bar-example.csv", ["category", "value"], [
      { category: "A", value: 12 },
      { category: "B", value: 18 },
      { category: "C", value: 9 },
      { category: "D", value: 15 },
    ]),
    defaultConfig: {
      timeColumn: null,      // we’ll use __index if needed
      valueColumn: "value",
    },
  },

  histogram: {
    id: "histogram",
    label: "Histogram",
    chartType: "bar", // visually we still show bars
    description: "Binned distribution (e.g., counts per range of values).",
    exampleDataset: makeDataset("histogram-example.csv", ["bin", "count"], [
      { bin: "0–10", count: 2 },
      { bin: "10–20", count: 5 },
      { bin: "20–30", count: 7 },
      { bin: "30–40", count: 3 },
      { bin: "40–50", count: 1 },
    ]),
    defaultConfig: {
      timeColumn: null,
      valueColumn: "count",
    },
  },

  scatter_spatial: {
    id: "scatter_spatial",
    label: "Scatter (spatial)",
    chartType: "scatter",
    description: "XY points, visually shown as a scatterplot.",
    exampleDataset: makeDataset("scatter-example.csv", ["x", "y"], [
      { x: 1, y: 3 },
      { x: 2, y: 4 },
      { x: 3, y: 2 },
      { x: 4, y: 5 },
      { x: 5, y: 3.5 },
      { x: 6, y: 4.2 },
    ]),
    defaultConfig: {
      timeColumn: "x",       // or null; you can decide later
      valueColumn: "y",
    },
  },

  scatter_temporal: {
    id: "scatter_temporal",
    label: "Scatter (temporal)",
    chartType: "scatter",
    description: "Points over time with a numeric value (variant of scatter).",
    exampleDataset: makeDataset("scatter-temporal.csv", ["time", "value"], [
      { time: 0, value: 5 },
      { time: 1, value: 9 },
      { time: 2, value: 7 },
      { time: 3, value: 11 },
      { time: 4, value: 10 },
    ]),
    defaultConfig: {
      timeColumn: "time",
      valueColumn: "value",
    },
  },

  boxplot: {
    id: "boxplot",
    label: "Boxplot (summary)",
    chartType: "line", // for now, we still just show as a line-ish summary
    description: "5-number summary example; visual uses a single series for now.",
    exampleDataset: makeDataset("boxplot-example.csv", ["stat", "value"], [
      { stat: "min", value: 5 },
      { stat: "Q1", value: 9 },
      { stat: "median", value: 12 },
      { stat: "Q3", value: 15 },
      { stat: "max", value: 20 },
    ]),
    defaultConfig: {
      timeColumn: null,      // row order for now
      valueColumn: "value",
    },
  },

  pie: {
    id: "pie",
    label: "Pie (proportions)",
    chartType: "bar", // visually reuse bar chart; sonification later
    description: "Categories and proportions (visually as bars, aurally as proportions later).",
    exampleDataset: makeDataset("pie-example.csv", ["category", "value"], [
      { category: "Segment A", value: 40 },
      { category: "Segment B", value: 25 },
      { category: "Segment C", value: 20 },
      { category: "Segment D", value: 15 },
    ]),
    defaultConfig: {
      timeColumn: null,
      valueColumn: "value",
    },
  },
};

export function getChartTypeForPreset(id: SonificationPresetId): ChartType {
  return SONIFICATION_PRESETS[id].chartType;
}
