import type { FlowchartData, NodeData, EdgeData } from "../types/types";
import {
  coreToTree,
  coreToLinkedList,
  coreToArray,
  coreTo2DArray,
} from "./vendor";
import type {
  IRArrayElement,
  IRDiagram,
  IREdge,
  IRMetadata,
  IRNode,
} from "./vendor";
import type { DiagramType } from "./diagramTypes";

/** Node labels come out of OCR with wrapping quotes and stray whitespace. */
export function cleanLabel(raw: string | undefined | null, fallback = ""): string {
  const s = (raw ?? "")
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return s || fallback;
}

type Pos = { x: number; y: number };

/** Top-left corner of a node, from either the stored corner pair or an {x, y} object. */
export function nodePosition(node: NodeData): Pos {
  const c: any = node.coordinates;
  if (Array.isArray(c) && Array.isArray(c[0])) return { x: Number(c[0][0]) || 0, y: Number(c[0][1]) || 0 };
  if (c && typeof c === "object" && "x" in c) return { x: Number(c.x) || 0, y: Number(c.y) || 0 };
  return { x: 0, y: 0 };
}

export function readingOrder(nodes: NodeData[]): NodeData[] {
  return [...nodes].sort((a, b) => {
    const pa = nodePosition(a);
    const pb = nodePosition(b);
    return pa.y - pb.y || pa.x - pb.x;
  });
}

const dedupeEdges = (edges: EdgeData[]) => {
  const seen = new Set<string>();
  return edges.filter((e) => {
    const key = `${e.source}->${e.destination}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

function toIRNodes(data: FlowchartData): IRNode[] {
  return data.nodes.map((n) => ({
    id: n.id,
    value: cleanLabel(n.label, n.id),
    shapeType: n.shape,
  }));
}

function toIREdges(data: FlowchartData): IREdge[] {
  return dedupeEdges(data.edges).map((e, index) => ({
    parent: e.source,
    child: e.destination,
    index,
    text: e.label ? cleanLabel(e.label) : undefined,
  }));
}

/** Nodes in list order: follow the arrows from the head; leftovers go in reading order. */
function listOrder(data: FlowchartData): NodeData[] {
  const byId = new Map(data.nodes.map((n) => [n.id, n]));
  const next = new Map<string, string>();
  const hasIncoming = new Set<string>();
  for (const e of dedupeEdges(data.edges)) {
    if (!byId.has(e.source) || !byId.has(e.destination)) continue;
    if (!next.has(e.source)) next.set(e.source, e.destination);
    hasIncoming.add(e.destination);
  }
  const ordered: NodeData[] = [];
  const seen = new Set<string>();
  const heads = readingOrder(data.nodes).filter((n) => !hasIncoming.has(n.id));
  for (const head of heads) {
    let cur: string | undefined = head.id;
    while (cur && !seen.has(cur) && byId.has(cur)) {
      seen.add(cur);
      ordered.push(byId.get(cur)!);
      cur = next.get(cur);
    }
  }
  for (const n of readingOrder(data.nodes)) {
    if (!seen.has(n.id)) ordered.push(n);
  }
  return ordered;
}

/** Group nodes into rows by vertical position (for the 2D array grid). */
function rowsByPosition(nodes: NodeData[]): NodeData[][] {
  const sorted = readingOrder(nodes);
  if (!sorted.length) return [];
  const heights = sorted.map((n) => {
    const c: any = n.coordinates;
    return Array.isArray(c) && Array.isArray(c[0]) && Array.isArray(c[1])
      ? Math.abs(Number(c[1][1]) - Number(c[0][1]))
      : 0;
  });
  const tolerance = Math.max(10, (heights.reduce((a, b) => a + b, 0) / heights.length) / 2);
  const rows: NodeData[][] = [];
  let rowY = nodePosition(sorted[0]).y;
  for (const n of sorted) {
    const y = nodePosition(n).y;
    if (!rows.length || Math.abs(y - rowY) > tolerance) {
      rows.push([]);
      rowY = y;
    }
    rows[rows.length - 1].push(n);
  }
  return rows.map((r) => r.sort((a, b) => nodePosition(a).x - nodePosition(b).x));
}

/**
 * Turn our flowchart JSON into Arboretum's intermediate representation for a data-structure
 * type. Returns null for plain flowcharts (they have no typed representation).
 */
export function toArboretumDiagram(
  type: DiagramType,
  data: FlowchartData,
  title = ""
): IRDiagram {
  if (type === "flowchart") return null;
  const meta: IRMetadata = { title, type, description: "" };

  switch (type) {
    case "tree":
    case "bt":
      return coreToTree(toIRNodes(data), toIREdges(data), meta);
    case "ll": {
      const nodes = listOrder(data).map((n) => ({
        id: n.id,
        value: cleanLabel(n.label, n.id),
        shapeType: n.shape,
      }));
      return coreToLinkedList(meta, nodes);
    }
    case "arr": {
      const elements: IRArrayElement[] = readingOrder(data.nodes).map((n) => ({
        id: n.id,
        value: cleanLabel(n.label, n.id),
      }));
      return coreToArray(elements, meta);
    }
    case "2arr": {
      const rows: IRArrayElement[] = rowsByPosition(data.nodes).map((row, r) => ({
        id: `row-${r}`,
        value: "",
        children: row.map((n) => ({ id: n.id, value: cleanLabel(n.label, n.id) })),
      }));
      return coreTo2DArray(rows, meta);
    }
    default:
      return null;
  }
}
