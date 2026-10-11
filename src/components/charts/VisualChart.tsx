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
}

export default function VisualChart({ rows, xField, yField, chartType }: Props) {
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

  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        {/* LINE-LIKE (line, boxplot, scatter-temporal if you route it here) */}
        {isLineLike && (
          <LineChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xField} />
            <YAxis />
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
            <XAxis dataKey={xField} />
            <YAxis />
            <Tooltip />
            <Bar dataKey={yField} fill="#ffa726" />
          </BarChart>
        )}

        {/* SCATTER */}
        {chartType === "scatter" && (
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xField} />
            <YAxis dataKey={yField} />
            <Tooltip />
            <Scatter data={rows} fill="#184c45" />
          </ScatterChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
