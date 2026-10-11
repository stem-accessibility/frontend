import type { VizIR, ChartType, Intent } from "../types/vizIR"; // reuse existing types
import type { Row } from "../services/parseCsv";

export type VisualizationRecord = {
  id: string;

  createdAt: string;
  updatedAt: string;

  datasetName: string;
  rowCount: number;

  // Inputs / provenance
  chartType: ChartType;
  intent: Intent;
  mapping: {
    xField: string;
    yField: string;
    aggregate: "sum" | "avg" | "count" | "none";
  };

  // Canonical artifacts
  rows: Row[];             // MVP: store full rows; later store pointer
  vegaLiteSpec: unknown;   // your VL spec object
  vizIR: VizIR;            // your existing IR

  // Derived outputs (optional, can be filled later)
  tactile?: {
    svgText: string;
    width?: string | null;
    height?: string | null;
    generatedAt: string;
  };

  // Placeholder for later
  sonification?: {
    enabled: boolean;
  };
};

export const GRAFARI_RECORD_SCHEMA_VERSION = 1;
