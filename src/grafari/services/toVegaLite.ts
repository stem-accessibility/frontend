import type { ChartData } from "./computeSeries";

type VLFieldType = "nominal" | "quantitative" | "temporal";

export function toVegaLiteSpec(args: {
  chartData: ChartData;
  title: string;
  xFieldLabel: string;
  yFieldLabel: string;
}) {
  const { chartData, title, xFieldLabel, yFieldLabel } = args;

  const schema = "https://vega.github.io/schema/vega-lite/v6.json";

  if (chartData.kind === "bar") {
    return {
      $schema: schema,
      title,
      data: { values: chartData.items.map((d) => ({ x: d.x, y: d.y })) },
      mark: { type: "bar" },
      encoding: {
        x: { field: "x", type: "nominal" as VLFieldType, title: xFieldLabel },
        y: { field: "y", type: "quantitative" as VLFieldType, title: yFieldLabel },
      },
    };
  }

  // line (x is YYYY-MM-DD; declare temporal)
  return {
    $schema: schema,
    title,
    data: { values: chartData.items.map((d) => ({ x: d.x, y: d.y })) },
    mark: { type: "line", point: true },
    encoding: {
      x: { field: "x", type: "temporal" as VLFieldType, title: xFieldLabel },
      y: { field: "y", type: "quantitative" as VLFieldType, title: yFieldLabel },
    },
  };
}
