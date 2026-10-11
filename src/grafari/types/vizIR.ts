export type ID = string;

export type ChartType = "bar" | "line";

export type Intent =
  | "compare_categories"
  | "trend_over_time"
  | "rank"
  | "distribution"
  | "relationship";

export type EncodingChannel = "x" | "y" | "color";

export type Encoding = {
  channel: EncodingChannel;
  fieldId: ID;
  aggregate?: "sum" | "avg" | "count" | "none";
};

export type Narrative = {
  title: string;
  shortSummary: string;
};

export type NavNode = {
  id: ID;
  label: string;
  role: "chart" | "axis" | "series" | "mark" | "summary";
  children?: ID[];
};

export type KeyboardModel = {
  order: ID[];
};

export type VizIR = {
  version: 1;
  id: ID;
  createdAt: string;

  dataset: {
    name: string;
    rowCount: number;
  };

  spec: {
    chartType: ChartType;
    intent: Intent;
    encodings: Encoding[];
  };

  narrative: Narrative;

  accessibility: {
    rootId: ID;
    tree: Record<ID, NavNode>;
    keyboard: KeyboardModel;
  };
};
