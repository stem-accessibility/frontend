import { v4 as uuidv4 } from "uuid";
import { type Row } from "./parseCsv";

// import { type DatasetProfile } from "./profileDataset";
import type {
  VizIR,
  ChartType,
  Intent,
  Encoding,
  NavNode,
} from "../types/vizIR";

type BuildArgs = {
  datasetName: string;
  rows: Row[];
  chartType: ChartType;
  intent: Intent;
  mapping: {
    xField: string;
    yField: string;
    aggregate: "sum" | "avg" | "count" | "none";
  };
};

export function buildVizIR(args: BuildArgs): VizIR {
  const {
    datasetName,
    rows,
    chartType,
    intent,
    mapping,
  } = args;

  const id = uuidv4();
  const createdAt = new Date().toISOString();

  const encodings: Encoding[] = [
    { channel: "x", fieldId: mapping.xField },
    {
      channel: "y",
      fieldId: mapping.yField,
      aggregate: mapping.aggregate,
    },
  ];

  const title = `${chartType === "bar" ? "Bar" : "Line"} chart of ${
    mapping.yField
  } by ${mapping.xField}`;

  const shortSummary = `This ${chartType} chart shows ${mapping.yField} by ${mapping.xField} using ${mapping.aggregate} aggregation.`;

  // Accessibility tree (minimal but correct)
  const rootId = "chart";
  const summaryId = "summary";
  const xAxisId = "x-axis";
  const yAxisId = "y-axis";

  const tree: Record<string, NavNode> = {
    [rootId]: {
      id: rootId,
      role: "chart",
      label: title,
      children: [summaryId, xAxisId, yAxisId],
    },
    [summaryId]: {
      id: summaryId,
      role: "summary",
      label: shortSummary,
    },
    [xAxisId]: {
      id: xAxisId,
      role: "axis",
      label: `X-axis: ${mapping.xField}`,
    },
    [yAxisId]: {
      id: yAxisId,
      role: "axis",
      label: `Y-axis: ${mapping.yField}`,
    },
  };

  return {
    version: 1,
    id,
    createdAt,
    dataset: {
      name: datasetName,
      rowCount: rows.length,
    },
    spec: {
      chartType,
      intent,
      encodings,
    },
    narrative: {
      title,
      shortSummary,
    },
    accessibility: {
      rootId,
      tree,
      keyboard: {
        order: [summaryId, xAxisId, yAxisId],
      },
    },
  };
}
