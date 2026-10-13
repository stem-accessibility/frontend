import type { Node, Edge } from '@xyflow/react';

export type NodeData = {
  id: string;
  label: string;
  shape: string;
  coordinates: [[number, number], [number, number]];
};

export type EdgeData = {
  id?: string;
  source: string;
  destination: string;
  label?: string;
  type?: string;
  arrowheads?: string[];
  markerEnd?: {
    type?: string;
  };
  points?: Array<{ x: number; y: number; id?: string; active?: boolean }>;
};

export type FlowchartData = {
  nodes: NodeData[];
  edges: EdgeData[];
};

// Final transformed result for ReactFlow
export type ReactFlowResult = {
  nodes: Node<NodeData>[];
  edges: Edge<EdgeData>[];
};

export type PermalinkResponse = {
  summary: string;
  json_data: FlowchartData;
  error?: string;
  short_alt: string;
  flowchart_type?: string | null;
  title?: string | null;
  is_published?: boolean;
  public_slug?: string | null;
  // NEW (from /get)
  has_image?: boolean;
  image_mime?: string | null;
  image_endpoint?: string | null;
};

export type PermalinkProps = {
  json: FlowchartData;
  summary: string;
  flowchartId?: string; // NEW
};

// For QRCodeGenerator.tsx
export type QRCodeProps = {
  permalink: string;
};

// For CopyLinkComponent.tsx
export type CopyLinkProps = {
  text: string;
};

// Basic parsed data
export interface ParsedRow {
  [key: string]: string | number | null;
}

export interface ParsedDataset {
  columns: string[];
  rows: ParsedRow[];
  name?: string; // original filename
}
export type SonificationPresetId =
  | "line"
  | "bar"
  | "histogram"
  | "scatter_spatial"
  | "scatter_temporal"
  | "boxplot"
  | "pie";
// How the user wants to sonify the data
export interface SonificationConfig {
  timeColumn?: string | null;
  valueColumn: string | null;
  preset: SonificationPresetId;  // or whatever you define
   categoryColumn?: string | null;
  // Chart options chosen by the author. All optional; blank means "use the column names".
  title?: string | null;
  xLabel?: string | null;
  yLabel?: string | null;
  categoryOrder?: "data" | "alpha" | "value-asc" | "value-desc";
}

// What you store for permalinks
export interface SonificationState {
  id: string;
  datasetId?: string;
  erieSpec: unknown; // actual Erie spec object
  config: SonificationConfig;
  createdAt: string;
}
