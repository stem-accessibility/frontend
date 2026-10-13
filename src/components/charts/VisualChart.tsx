// src/components/charts/VisualChart.tsx
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export type ChartType =
  | "line"
  | "bar"
  | "histogram"
  | "scatter"
  | "boxplot"
  | "pie";

interface Props {
  rows: Record<string, any>[];
  xField: string;
  yField: string;
  chartType: ChartType;
  title?: string;
  xLabel?: string;
  yLabel?: string;
}

export default function VisualChart({ rows, xField, yField, chartType, title, xLabel, yLabel }: Props) {
  if (!rows || rows.length === 0) {
    return <p>No data loaded.</p>;
  }

  const first = rows[0] ?? {};
  if (!(xField in first) || !(yField in first)) {
    return (
      <p className="hint">
        Select the appropriate columns for this preset to preview the chart.
      </p>
    );
  }

  // For now, map some higher-level variants onto base chart primitives
  const isBarLike =
    chartType === "bar" || chartType === "histogram" || chartType === "pie";
  const isLineLike = chartType === "line" || chartType === "boxplot";

  const xAxisLabel = xLabel ? { value: xLabel, position: "insideBottom" as const, offset: -4 } : undefined;
  const yAxisLabel = yLabel ? { value: yLabel, angle: -90, position: "insideLeft" as const } : undefined;
  const xAxisHeight = xLabel ? 50 : undefined;
  const yAxisWidth = yLabel ? 70 : undefined;

  return (
    // The drawing is an SVG with no useful text of its own, so give it one name and point to the
    // text equivalents on this page.
    <div
      style={{ width: "100%", height: 300 }}
      role="img"
      aria-label={`${title ?? "Chart"}: ${yLabel ?? yField} by ${xLabel ?? xField}. The data table and navigable chart below give the same information as text.`}
    >
      <ResponsiveContainer>
        {/* LINE-LIKE (line, boxplot, scatter-temporal if you route it here) */}
        {isLineLike && (
          <LineChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xField} label={xAxisLabel} height={xAxisHeight} />
            <YAxis label={yAxisLabel} width={yAxisWidth} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey={yField}
              stroke="#f58025"
              strokeWidth={2}
              dot={{ r: chartType === "boxplot" ? 0 : 2 }}
            />
          </LineChart>
        )}

        {/* BAR-LIKE (bar, histogram, pie-as-bars) */}
        {isBarLike && (
          <BarChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xField} label={xAxisLabel} height={xAxisHeight} />
            <YAxis label={yAxisLabel} width={yAxisWidth} />
            <Tooltip />
            <Bar dataKey={yField} fill="#ffa726" />
          </BarChart>
        )}

        {/* SCATTER */}
        {chartType === "scatter" && (
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xField} label={xAxisLabel} height={xAxisHeight} />
            <YAxis dataKey={yField} label={yAxisLabel} width={yAxisWidth} />
            <Tooltip />
            <Scatter data={rows} fill="#184c45" />
          </ScatterChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
