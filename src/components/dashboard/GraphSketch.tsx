import { useMemo } from "react";
import type { FlowchartData } from "../../types/types";

type Box = { id: string; x: number; y: number; w: number; h: number; shape: string };

function toBoxes(data: FlowchartData): Box[] {
  const out: Box[] = [];
  for (const n of data.nodes) {
    const c: any = n.coordinates;
    let x = 0,
      y = 0,
      w = 100,
      h = 50;
    if (Array.isArray(c) && Array.isArray(c[0]) && Array.isArray(c[1])) {
      x = Number(c[0][0]) || 0;
      y = Number(c[0][1]) || 0;
      w = Math.max(10, (Number(c[1][0]) || 0) - x);
      h = Math.max(10, (Number(c[1][1]) || 0) - y);
    } else if (c && typeof c === "object" && "x" in c) {
      x = Number(c.x) || 0;
      y = Number(c.y) || 0;
    }
    out.push({ id: n.id, x, y, w, h, shape: n.shape });
  }
  return out;
}

/** A tiny decorative drawing of the graph, for cards whose STEM image has no uploaded picture. */
export default function GraphSketch({ data }: { data: FlowchartData }) {
  const { boxes, edges, view } = useMemo(() => {
    const boxes = toBoxes(data);
    const minX = Math.min(...boxes.map((b) => b.x));
    const minY = Math.min(...boxes.map((b) => b.y));
    const maxX = Math.max(...boxes.map((b) => b.x + b.w));
    const maxY = Math.max(...boxes.map((b) => b.y + b.h));
    const pad = 16;
    const byId = new Map(boxes.map((b) => [b.id, b]));
    const edges = data.edges
      .map((e) => ({ a: byId.get(e.source), b: byId.get(e.destination) }))
      .filter((e): e is { a: Box; b: Box } => !!e.a && !!e.b);
    return {
      boxes,
      edges,
      view: `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`,
    };
  }, [data]);

  return (
    <svg
      className="thumbnail__sketch"
      viewBox={view}
      preserveAspectRatio="xMidYMid meet"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <marker id="sk-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0 L10 5 L0 10 z" fill="currentColor" />
        </marker>
      </defs>
      {edges.map((e, i) => (
        <line
          key={i}
          x1={e.a.x + e.a.w / 2}
          y1={e.a.y + e.a.h / 2}
          x2={e.b.x + e.b.w / 2}
          y2={e.b.y + e.b.h / 2}
          stroke="currentColor"
          strokeWidth={2.5}
          markerEnd="url(#sk-arrow)"
          opacity={0.7}
        />
      ))}
      {boxes.map((b) => {
        const cx = b.x + b.w / 2;
        const cy = b.y + b.h / 2;
        const common = { fill: "var(--white, #fff)", stroke: "currentColor", strokeWidth: 2.5 };
        if (b.shape === "circle" || b.shape === "ellipse") {
          return <ellipse key={b.id} cx={cx} cy={cy} rx={b.w / 2} ry={b.h / 2} {...common} />;
        }
        if (b.shape === "diamond") {
          const pts = `${cx},${b.y} ${b.x + b.w},${cy} ${cx},${b.y + b.h} ${b.x},${cy}`;
          return <polygon key={b.id} points={pts} {...common} />;
        }
        return <rect key={b.id} x={b.x} y={b.y} width={b.w} height={b.h} rx={8} {...common} />;
      })}
    </svg>
  );
}
