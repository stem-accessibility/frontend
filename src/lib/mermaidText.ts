// A small, dependency-free reader for the Mermaid text people write by hand:
//   - flowchart / graph  (nodes with shapes, chained links, link labels)
//   - block-beta         (arrays and 2D arrays, as Arboretum uses them)
// It runs in the browser on every keystroke, so the markdown editor can show a live preview
// without a network call or AI. It does not try to cover all of Mermaid; unsupported lines are
// reported as warnings rather than failing the whole parse.
import dagre from "dagre";
import type { EdgeData, FlowchartData, NodeData } from "../types/types";

export type ParsedMermaid = {
  data: FlowchartData;
  title: string;
  warnings: string[];
  /** Set when there is nothing to show; the message explains why. */
  error: string | null;
};

type RawNode = { id: string; label: string; shape: string };
type RawEdge = { source: string; destination: string; label?: string };

const NODE_H = 56;
const CELL_W = 110;
const CELL_H = 70;

const SKIP_LINE =
  /^(subgraph\b|end\b|classDef\b|class\b|style\b|linkStyle\b|click\b|direction\b|accDescr\b|%%)/i;

// Opening token, closing token, our shape name. Longest openers first.
const SHAPES: Array<[string, string, string]> = [
  ["(((", ")))", "circle"],
  ["((", "))", "circle"],
  ["([", "])", "round-rectangle"],
  ["[[", "]]", "rectangle"],
  ["[(", ")]", "cylinder"],
  ["{{", "}}", "hexagon"],
  ["[/", "/]", "parallelogram"],
  ["[\\", "\\]", "parallelogram"],
  ["[", "]", "rectangle"],
  ["(", ")", "round-rectangle"],
  ["{", "}", "diamond"],
  [">", "]", "rectangle"],
];

const cleanText = (s: string) =>
  s
    .trim()
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

function textWidth(label: string) {
  return Math.min(260, Math.max(90, label.length * 8 + 40));
}

function toNodeData(n: RawNode, x: number, y: number, w: number, h: number): NodeData {
  return {
    id: n.id,
    label: n.label,
    shape: n.shape,
    coordinates: [
      [x, y],
      [x + w, y + h],
    ],
  };
}

function toEdgeData(e: RawEdge, i: number): EdgeData {
  return {
    id: `edge-${i}`,
    source: e.source,
    destination: e.destination,
    label: e.label,
    type: "solid",
    markerEnd: { type: "arrowclosed" },
  };
}

// ---------- flowchart ----------

/** Read one node reference at `pos`: an id with an optional shaped label. */
function readNode(s: string, pos: number): { node: RawNode; end: number } | null {
  const m = /^[A-Za-z0-9_À-￿-]+/.exec(s.slice(pos));
  if (!m) return null;
  let id = m[0];
  // An id never ends in "-" (that starts a link such as "A-->B").
  while (id.endsWith("-")) id = id.slice(0, -1);
  if (!id) return null;
  let end = pos + id.length;
  let label = id;
  let shape = "rectangle";

  for (const [open, close, name] of SHAPES) {
    if (!s.startsWith(open, end)) continue;
    const bodyStart = end + open.length;
    let searchFrom = bodyStart;
    const q = s[bodyStart];
    if (q === '"' || q === "'") {
      const qEnd = s.indexOf(q, bodyStart + 1);
      if (qEnd !== -1) searchFrom = qEnd + 1;
    }
    const closeAt = s.indexOf(close, searchFrom);
    if (closeAt === -1) return null;
    label = cleanText(s.slice(bodyStart, closeAt)) || id;
    shape = name;
    end = closeAt + close.length;
    break;
  }
  return { node: { id, label, shape }, end };
}

/** Read a link at `pos` (e.g. "-->", "-- yes -->", "-->|yes|", "-.->", "==>"). */
function readLink(s: string, pos: number): { label?: string; end: number } | null {
  const rest = s.slice(pos);
  // "-- text -->" / "-. text .->" / "== text ==>"
  let m = /^(--|-\.|==)\s+(.+?)\s+(-->|\.->|==>|---)/.exec(rest);
  if (m) return { label: cleanText(m[2]), end: pos + m[0].length };
  m = /^(<?(?:-{2,}|={2,}|-\.+-?)>?)(\s*\|([^|]*)\|)?/.exec(rest);
  if (m && /[-=]/.test(m[1])) {
    return { label: m[3] !== undefined ? cleanText(m[3]) : undefined, end: pos + m[0].length };
  }
  return null;
}

function parseFlowchartText(text: string): ParsedMermaid {
  const warnings: string[] = [];
  const nodes = new Map<string, RawNode>();
  const edges: RawEdge[] = [];
  let title = "";
  let direction = "TB";

  // A later mention with just the id must not erase an earlier label or shape.
  const remember = (n: RawNode) => {
    if (!nodes.has(n.id) || n.label !== n.id) nodes.set(n.id, n);
  };

  const statements = text
    .split(/\r?\n/)
    .flatMap((line) => line.split(";"))
    .map((l) => l.replace(/%%.*$/, "").trim())
    .filter(Boolean);

  for (const stmt of statements) {
    const head = /^(flowchart|graph)\s*(TD|TB|BT|LR|RL)?/i.exec(stmt);
    if (head) {
      if (head[2]) direction = head[2].toUpperCase();
      continue;
    }
    const acc = /^(accTitle|title)\s*:?\s*(.*)$/i.exec(stmt);
    if (acc) {
      if (acc[2]) title = cleanText(acc[2]);
      continue;
    }
    if (SKIP_LINE.test(stmt)) continue;

    let pos = 0;
    const first = readNode(stmt, pos);
    if (!first) {
      warnings.push(`Could not read: ${stmt}`);
      continue;
    }
    remember(first.node);
    let prev = first.node;
    pos = first.end;

    while (pos < stmt.length) {
      while (stmt[pos] === " ") pos++;
      if (pos >= stmt.length) break;
      const link = readLink(stmt, pos);
      if (!link) {
        warnings.push(`Could not read: ${stmt}`);
        break;
      }
      pos = link.end;
      while (stmt[pos] === " ") pos++;
      const next = readNode(stmt, pos);
      if (!next) {
        warnings.push(`A link has no node after it: ${stmt}`);
        break;
      }
      remember(next.node);
      edges.push({ source: prev.id, destination: next.node.id, label: link.label || undefined });
      prev = nodes.get(next.node.id) ?? next.node;
      pos = next.end;
    }
  }

  if (!nodes.size) {
    return {
      data: { nodes: [], edges: [] },
      title,
      warnings,
      error: "No nodes yet. Start with a line like  flowchart TD  and then  A[Start] --> B[Next].",
    };
  }

  const g = new dagre.graphlib.Graph({ multigraph: true });
  g.setGraph({
    rankdir: direction === "TD" ? "TB" : direction,
    nodesep: 40,
    ranksep: 60,
    marginx: 20,
    marginy: 20,
  });
  g.setDefaultEdgeLabel(() => ({}));
  for (const n of nodes.values()) g.setNode(n.id, { width: textWidth(n.label), height: NODE_H });
  const kept = edges.filter((e) => nodes.has(e.source) && nodes.has(e.destination));
  kept.forEach((e, i) => g.setEdge(e.source, e.destination, {}, `e${i}`));
  dagre.layout(g);

  const out: NodeData[] = [...nodes.values()].map((n) => {
    const p = g.node(n.id);
    const w = p?.width ?? textWidth(n.label);
    const h = p?.height ?? NODE_H;
    return toNodeData(n, (p?.x ?? 0) - w / 2, (p?.y ?? 0) - h / 2, w, h);
  });

  return {
    data: { nodes: out, edges: kept.map(toEdgeData) },
    title,
    warnings,
    error: null,
  };
}

// ---------- block-beta (arrays) ----------

function parseBlockText(text: string): ParsedMermaid {
  const warnings: string[] = [];
  let columns = 0;
  let title = "";
  const items: RawNode[] = [];

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/%%.*$/, "").trim();
    if (!line || /^block(-beta)?\b/i.test(line)) continue;
    const cols = /^columns\s+(\d+)/i.exec(line);
    if (cols) {
      columns = Math.max(0, parseInt(cols[1], 10) || 0);
      continue;
    }
    const acc = /^(accTitle|title)\s*:?\s*(.*)$/i.exec(line);
    if (acc) {
      if (acc[2]) title = cleanText(acc[2]);
      continue;
    }
    if (SKIP_LINE.test(line)) continue;

    const re = /([A-Za-z0-9_]+)(?:\[(?:"([^"]*)"|([^\]]*))\])?/g;
    let m: RegExpExecArray | null;
    let any = false;
    while ((m = re.exec(line))) {
      any = true;
      const label = cleanText(m[2] ?? m[3] ?? m[1]) || m[1];
      items.push({ id: m[1], label, shape: "rectangle" });
    }
    if (!any) warnings.push(`Could not read: ${line}`);
  }

  if (!items.length) {
    return {
      data: { nodes: [], edges: [] },
      title,
      warnings,
      error: 'No values yet. Try  block-beta  then  a["1"] b["2"] c["3"].',
    };
  }

  const perRow = columns > 0 ? columns : items.length;
  const out = items.map((n, i) =>
    toNodeData(n, (i % perRow) * CELL_W, Math.floor(i / perRow) * CELL_H, CELL_W - 10, NODE_H)
  );
  return { data: { nodes: out, edges: [] }, title, warnings, error: null };
}

export function parseMermaidText(text: string): ParsedMermaid {
  if (!text.trim()) {
    return {
      data: { nodes: [], edges: [] },
      title: "",
      warnings: [],
      error: "Type or paste some text to see a preview.",
    };
  }
  const firstLine = text.split(/\r?\n/).find((l) => l.trim() && !l.trim().startsWith("%%")) ?? "";
  return /^\s*block(-beta)?\b/i.test(firstLine) ? parseBlockText(text) : parseFlowchartText(text);
}

/** Example text per type, so someone starting out has something that works. */
export const MARKDOWN_EXAMPLES: Record<string, string> = {
  flowchart: `flowchart TD
  A([Start]) --> B{Is it ready?}
  B -- Yes --> C[Ship it]
  B -- No --> D[Fix it]
  D --> B`,
  tree: `flowchart TD
  accTitle: Course topics
  A((Algorithms)) --> B((Sorting))
  A --> C((Searching))
  B --> D((Merge sort))
  B --> E((Quick sort))`,
  bt: `flowchart TD
  accTitle: Binary search tree
  A((8)) --> B((3))
  A --> C((10))
  B --> D((1))
  B --> E((6))`,
  ll: `flowchart LR
  accTitle: Linked list
  A((1)) --> B((2)) --> C((3))`,
  arr: `block-beta
  accTitle: Array
  a["4"] b["8"] c["15"] d["16"]`,
  "2arr": `block-beta
  accTitle: Grid
  columns 3
  a["1"] b["2"] c["3"]
  d["4"] e["5"] f["6"]`,
};
