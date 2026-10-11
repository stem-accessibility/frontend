type EdgeLike = {
  id?: string;
  source: string | null;
  destination: string | null;
  label?: string;
  type?: string;
  arrowheads?: string[];
  [key: string]: unknown;
};

type NodeLike = {
  id: string;
  [key: string]: unknown;
};

export type FlowchartJson = {
  nodes: NodeLike[];
  edges: EdgeLike[];
  [key: string]: unknown;
};

function stableEdgeId(e: EdgeLike, index: number) {
  const src = e.source ?? "null";
  const dst = e.destination ?? "null";
  const type = (e.type ?? "edge").toLowerCase();

  // Keep label optional but deterministic
  const label = (typeof e.label === "string" ? e.label.trim() : "");
  const labelPart = label ? `__${slug(label)}` : "";

  // Include arrowheads to avoid collisions if you truly treat them as semantically meaningful
  const ah = Array.isArray(e.arrowheads) ? e.arrowheads.join("-") : "";
  const ahPart = ah ? `__ah_${slug(ah)}` : "";

  // Index is a last-resort tie-breaker; stable as long as edge ordering is stable
  return `edge__${type}__${src}__${dst}${labelPart}${ahPart}__i_${index}`;
}

function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 60);
}

export function normalizeFlowchartJson(input: FlowchartJson): FlowchartJson {
  const nodes = Array.isArray(input.nodes) ? input.nodes : [];
  const edges = Array.isArray(input.edges) ? input.edges : [];

  const nodeIdSet = new Set(nodes.map((n) => n.id));

  // 1) Remove null edges AND edges pointing to missing nodes (optional but recommended)
  const filtered = edges.filter((e) => {
    if (!e) return false;
    if (!e.source || !e.destination) return false; // removes null endpoints
    if (!nodeIdSet.has(e.source)) return false;
    if (!nodeIdSet.has(e.destination)) return false;
    return true;
  });

  // 2) Stabilize IDs deterministically
  const stabilized = filtered.map((e, idx) => ({
    ...e,
    id: stableEdgeId(e, idx),
  }));

  return {
    ...input,
    nodes,
    edges: stabilized,
  };
}
