import React, { useMemo } from "react";
import type { ChartData } from "../services/computeSeries";

type Props = {
  title?: string;
  data: ChartData;
  width?: number;
  height?: number;
};

function formatDate(d: Date) {
  // MVP: YYYY-MM-DD
  return d.toISOString().slice(0, 10);
}

const ChartRenderer: React.FC<Props> = ({ title, data, width = 720, height = 360 }) => {
  const padding = 44;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const maxY = useMemo(() => {
    const ys = data.items.map((d: any) => d.y);
    const m = Math.max(0, ...ys);
    return m === 0 ? 1 : m;
  }, [data]);

  const yScale = (y: number) => padding + innerH - (y / maxY) * innerH;

  // draw baseline + axes
  const x0 = padding;
  const y0 = padding + innerH;
  const x1 = padding + innerW;

  if (data.kind === "bar") {
    const items = data.items;
    const n = Math.max(1, items.length);
    const gap = 8;
    const barW = Math.max(6, innerW / n - gap);

    return (
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={title ?? "Chart"}
        style={{ display: "block", width: "100%", height: "auto" }}
      >
        {title && (
          <text x={padding} y={20} fontSize={14}>
            {title}
          </text>
        )}

        {/* axes */}
        <line x1={x0} y1={y0} x2={x1} y2={y0} stroke="currentColor" />
        <line x1={x0} y1={padding} x2={x0} y2={y0} stroke="currentColor" />

        {/* bars */}
        {items.map((d, i) => {
          const x = x0 + i * (barW + gap);
          const y = yScale(d.y);
          const h = y0 - y;

          return (
            <g key={`${d.x}-${i}`}>
              <rect x={x} y={y} width={barW} height={h} fill="currentColor" opacity={0.85} />
              {/* x label */}
              <text x={x + barW / 2} y={y0 + 14} fontSize={10} textAnchor="middle">
                {String(d.x).length > 10 ? String(d.x).slice(0, 10) + "…" : String(d.x)}
              </text>
              {/* y value */}
              <text x={x + barW / 2} y={y - 6} fontSize={10} textAnchor="middle">
                {Number.isFinite(d.y) ? d.y.toFixed(2).replace(/\.00$/, "") : ""}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  // line
  const points = data.items;
  const n = Math.max(1, points.length);

  const xPos = (i: number) => {
    if (n === 1) return x0 + innerW / 2;
    return x0 + (i / (n - 1)) * innerW;
  };

  const pathD = points
    .map((p, i) => {
      const x = xPos(i);
      const y = yScale(p.y);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      role="img"
      aria-label={title ?? "Chart"}
      style={{ display: "block", width: "100%", height: "auto" }}
    >
      {title && (
        <text x={padding} y={20} fontSize={14}>
          {title}
        </text>
      )}

      {/* axes */}
      <line x1={x0} y1={y0} x2={x1} y2={y0} stroke="currentColor" />
      <line x1={x0} y1={padding} x2={x0} y2={y0} stroke="currentColor" />

      {/* line */}
      <path d={pathD} fill="none" stroke="currentColor" strokeWidth={2} />

      {/* points + a few tick labels */}
      {points.map((p, i) => {
        const x = xPos(i);
        const y = yScale(p.y);
        const showTick = i === 0 || i === n - 1 || i === Math.floor((n - 1) / 2);

        return (
          <g key={`${p.x.toISOString()}-${i}`}>
            <circle cx={x} cy={y} r={3} fill="currentColor" />
            {showTick && (
              <text x={x} y={y0 + 14} fontSize={10} textAnchor="middle">
                {formatDate(p.x)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

export default ChartRenderer;
