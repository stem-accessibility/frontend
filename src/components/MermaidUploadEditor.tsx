import { useMemo, useState } from "react";
import dagre from "dagre";
import type { FlowchartData, NodeData, EdgeData } from "../types/types";

type ParsedGraph = {
  nodes: Array<{ id: string; label: string }>;
  edges: Array<{ source: string; destination: string; label?: string }>;
};

const DEFAULT_NODE_W = 180;
const DEFAULT_NODE_H = 60;

function layoutWithDagre(parsed: ParsedGraph): FlowchartData {
  const g = new dagre.graphlib.Graph({ multigraph: true });
g.setGraph({ rankdir: 'TB', nodesep: 40, ranksep: 60, marginx: 20, marginy: 20 });
g.setDefaultEdgeLabel(() => ({}));

  // 1) Add nodes with fixed size
  for (const n of parsed.nodes) {
    g.setNode(n.id, { width: DEFAULT_NODE_W, height: DEFAULT_NODE_H, label: n.label });
  }

  // 2) Add edges
  parsed.edges.forEach((e, i) => {
  g.setEdge(e.source, e.destination, {}, `e${i}`);
});

  dagre.layout(g);

  // 3) Convert Dagre (center x/y) to your NodeData coordinates [[x1,y1],[x2,y2]]
  const nodes: NodeData[] = parsed.nodes.map((n) => {
    const pos = g.node(n.id); // { x, y, width, height }
    const w = pos?.width ?? DEFAULT_NODE_W;
    const h = pos?.height ?? DEFAULT_NODE_H;

    const x1 = (pos?.x ?? 0) - w / 2;
    const y1 = (pos?.y ?? 0) - h / 2;
    const x2 = x1 + w;
    const y2 = y1 + h;

    return {
      id: n.id,
      label: n.label,
      shape: "rectangle",
      coordinates: [[x1, y1], [x2, y2]],
    };
  });

  const edges: EdgeData[] = parsed.edges.map((e, idx) => ({
    id: `edge-${idx}`,
    source: e.source,
    destination: e.destination,
    label: e.label,
    type: "solid",
    markerEnd: { type: "arrowclosed" },
  }));

  return { nodes, edges };
}

export default function MermaidUploadEditor({
  value,
  onChange,
  onGenerate,
}: {
  value: string;
  onChange: (next: string) => void;
  onGenerate: (data: FlowchartData, mermaidText: string) => void;
}) {

  const API_URL = import.meta.env.VITE_API_URL;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEmpty = useMemo(() => value.trim().length === 0, [value]);



  //const res = await fetch(`${API_URL}/parse-mermaid` 
  const handleGenerate = async () => {
    setError(null);
    setIsLoading(true);
    try {
      // Backend parses Mermaid to a node/edge graph (no coordinates)
      const res = await fetch(`${API_URL}/parse-mermaid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mermaid: value }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to parse Mermaid");
      }

      const parsed: ParsedGraph = await res.json();
      const flowchartData = layoutWithDagre(parsed);

      onGenerate(flowchartData, value);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Failed to generate diagram from Mermaid.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h3>Upload Mermaid</h3>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={12}
        style={{ width: "100%", fontFamily: "monospace" }}
        placeholder="Paste Mermaid code here..."
      />

      {error && <div style={{ fontSize: 12 }}>{error}</div>}

      <button onClick={handleGenerate} disabled={isEmpty || isLoading}>
        {isLoading ? "Generating..." : "Generate diagram from Mermaid"}
      </button>
    </div>
  );
}
