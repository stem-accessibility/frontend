import type { FlowchartData } from "../types/types";
import type { LongDescriptionSectionKey } from "../types/longDescription";
import { cleanLabel, nodePosition, readingOrder, toArboretumDiagram } from "./adapt";
import type { DiagramType } from "./diagramTypes";
import { diagramTypeLabel, isTreeType } from "./diagramTypes";
import {
  buildTree,
  traverseInOrder,
  traversePostOrder,
  traversePreOrder,
  generateLinkedListDescription,
  generateTreeDescription,
  generateArrayDescription,
  PHANTOM_NODE_IDS,
} from "./vendor";
import type { IRArray, IRLinkedList, IRNode, IRTree } from "./vendor";

export type AutoDescription = {
  shortAlt: string;
  sections: Record<LongDescriptionSectionKey, string>;
};

// ---------- small text helpers ----------

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** "A", "A and B", "A, B, and C" */
const list = (items: string[]) =>
  items.length <= 1
    ? items.join("")
    : items.length === 2
      ? `${items[0]} and ${items[1]}`
      : `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;

const q = (s: string) => `“${s}”`;

const sentence = (s: string) => s.replace(/\s+/g, " ").trim();

const bullets = (items: string[]) => items.map((i) => `- ${i}`).join("\n");

// ---------- generic graph analysis ----------

type Graph = {
  ids: string[];
  label: Map<string, string>;
  shape: Map<string, string>;
  out: Map<string, { to: string; label: string }[]>;
  incoming: Map<string, string[]>;
  pos: Map<string, { x: number; y: number }>;
};

function buildGraph(data: FlowchartData): Graph {
  const ordered = readingOrder(data.nodes);
  const label = new Map<string, string>();
  const shape = new Map<string, string>();
  const pos = new Map<string, { x: number; y: number }>();
  for (const n of ordered) {
    label.set(n.id, cleanLabel(n.label, n.id));
    shape.set(n.id, (n.shape || "").toLowerCase());
    pos.set(n.id, nodePosition(n));
  }
  const out = new Map<string, { to: string; label: string }[]>();
  const incoming = new Map<string, string[]>();
  for (const id of label.keys()) {
    out.set(id, []);
    incoming.set(id, []);
  }
  const seen = new Set<string>();
  for (const e of data.edges) {
    if (!label.has(e.source) || !label.has(e.destination)) continue;
    const key = `${e.source}->${e.destination}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.get(e.source)!.push({ to: e.destination, label: cleanLabel(e.label) });
    incoming.get(e.destination)!.push(e.source);
  }
  // Branches read left to right so the description is stable.
  for (const edges of out.values()) {
    edges.sort((a, b) => (pos.get(a.to)!.x - pos.get(b.to)!.x) || (pos.get(a.to)!.y - pos.get(b.to)!.y));
  }
  return { ids: [...label.keys()], label, shape, out, incoming, pos };
}

/** Number of distinct start-to-end routes, counted up to a cap, with loops cut. */
function countPaths(g: Graph, starts: string[], ends: Set<string>, cap = 100): number {
  let total = 0;
  const onPath = new Set<string>();
  const walk = (id: string) => {
    if (total >= cap) return;
    if (ends.has(id)) {
      total += 1;
      return;
    }
    onPath.add(id);
    for (const e of g.out.get(id)!) if (!onPath.has(e.to)) walk(e.to);
    onPath.delete(id);
  };
  for (const s of starts) walk(s);
  return total;
}

function hasCycle(g: Graph): boolean {
  const state = new Map<string, 0 | 1 | 2>();
  const visit = (id: string): boolean => {
    state.set(id, 1);
    for (const e of g.out.get(id)!) {
      const s = state.get(e.to) ?? 0;
      if (s === 1) return true;
      if (s === 0 && visit(e.to)) return true;
    }
    state.set(id, 2);
    return false;
  };
  return g.ids.some((id) => (state.get(id) ?? 0) === 0 && visit(id));
}

function componentCount(g: Graph): number {
  const adj = new Map<string, Set<string>>();
  g.ids.forEach((id) => adj.set(id, new Set()));
  for (const [from, edges] of g.out) for (const e of edges) {
    adj.get(from)!.add(e.to);
    adj.get(e.to)!.add(from);
  }
  const seen = new Set<string>();
  let count = 0;
  for (const id of g.ids) {
    if (seen.has(id)) continue;
    count += 1;
    const stack = [id];
    while (stack.length) {
      const cur = stack.pop()!;
      if (seen.has(cur)) continue;
      seen.add(cur);
      adj.get(cur)!.forEach((n) => stack.push(n));
    }
  }
  return count;
}

function isTerminalShape(shape: string) {
  return /oval|ellipse|terminal|rounded|circle|pill|start|end/.test(shape);
}

// ---------- flowchart ----------

function describeFlowchart(data: FlowchartData, title: string): AutoDescription {
  const g = buildGraph(data);
  const L = (id: string) => g.label.get(id)!;
  const n = g.ids.length;

  if (n === 0) {
    return {
      shortAlt: "An empty flowchart with no steps yet.",
      sections: { purpose: "", structure: "", keyComponents: "", traversal: "", mainTakeaway: "" },
    };
  }

  const edgeCount = [...g.out.values()].reduce((sum, e) => sum + e.length, 0);
  let starts = g.ids.filter((id) => g.incoming.get(id)!.length === 0);
  if (!starts.length) starts = [g.ids[0]];
  const ends = g.ids.filter((id) => g.out.get(id)!.length === 0);
  const splits = g.ids.filter((id) => g.out.get(id)!.length >= 2);
  // A split whose arrows carry labels (yes / no, ...) is a decision; otherwise it is a fork.
  const isDecision = (id: string) => g.out.get(id)!.some((e) => e.label);
  const decisions = splits.filter(isDecision);
  const forks = splits.filter((id) => !isDecision(id));
  const loops = hasCycle(g);
  const parts = componentCount(g);
  const paths = countPaths(g, starts, new Set(ends));

  const xs = g.ids.map((id) => g.pos.get(id)!.x);
  const ys = g.ids.map((id) => g.pos.get(id)!.y);
  const spanX = Math.max(...xs) - Math.min(...xs);
  const spanY = Math.max(...ys) - Math.min(...ys);
  const direction = n < 2 ? "" : spanY >= spanX ? "top to bottom" : "left to right";

  // purpose
  const startText = list(starts.map((s) => q(L(s))));
  const endText = ends.length ? list(ends.map((e) => q(L(e)))) : "";
  const purposeBits = [
    title ? `This flowchart is titled ${q(title)}.` : "",
    `It has ${plural(n, "step")} and begins at ${startText}${endText ? ` and finishes at ${endText}` : ""}.`,
  ];

  // structure
  const structureBits = [
    `The flowchart reads ${direction || "in one place"} and connects ${plural(n, "step")} with ${plural(edgeCount, "arrow")}.`,
    decisions.length
      ? `${plural(decisions.length, "step")} ${decisions.length === 1 ? "is a decision that splits" : "are decisions that split"} the flow into separate branches.`
      : "",
    forks.length
      ? `${plural(forks.length, "step")} ${forks.length === 1 ? "branches" : "branch"} into several steps that can each be followed.`
      : "",
    !splits.length ? "There are no decisions, so the steps run in a single line." : "",
    loops ? "Some arrows lead back to an earlier step, so parts of the process repeat." : "",
    parts > 1 ? `The diagram is in ${parts} separate, unconnected parts.` : "",
  ];

  // key components
  const components: string[] = [];
  components.push(`Start: ${startText}`);
  for (const d of splits) {
    const branches = g.out.get(d)!.map((e) => (e.label ? `${q(e.label)} leads to ${q(L(e.to))}` : q(L(e.to))));
    components.push(
      isDecision(d)
        ? `Decision ${q(L(d))}: ${branches.join("; ")}`
        : `${q(L(d))} branches into ${plural(branches.length, "step")}: ${branches.join(", ")}`
    );
  }
  if (endText) components.push(`${ends.length === 1 ? "End point" : "End points"}: ${endText}`);
  const terminals = g.ids.filter((id) => isTerminalShape(g.shape.get(id)!) && !starts.includes(id) && !ends.includes(id));
  if (terminals.length) components.push(`Other start or end style steps: ${list(terminals.map((t) => q(L(t))))}`);

  // traversal: depth-first from each start, each step described once
  const lines: string[] = [];
  const described = new Set<string>();
  const onPath = new Set<string>();
  const walk = (id: string, depth: number) => {
    const indent = "  ".repeat(depth);
    if (described.has(id)) {
      lines.push(`${indent}- Continue at ${q(L(id))}, described above.`);
      return;
    }
    described.add(id);
    onPath.add(id);
    const next = g.out.get(id)!;
    if (next.length === 0) {
      lines.push(`${indent}- ${q(L(id))}. This is an end point.`);
    } else if (next.length === 1) {
      const e = next[0];
      lines.push(`${indent}- ${q(L(id))}${e.label ? `, then (${e.label})` : ", then"}`);
      if (onPath.has(e.to)) lines.push(`${indent}  - Go back to ${q(L(e.to))}.`);
      else walk(e.to, depth);
    } else {
      const decision = isDecision(id);
      lines.push(
        `${indent}- ${q(L(id))}. ${decision ? "Choose a path:" : `It branches into ${next.length} steps:`}`
      );
      next.forEach((e, i) => {
        const tag = e.label ? `If ${q(e.label)}:` : `Branch ${i + 1} of ${next.length}:`;
        if (onPath.has(e.to)) {
          lines.push(`${indent}  - ${tag} go back to ${q(L(e.to))}.`);
        } else {
          lines.push(`${indent}  - ${tag}`);
          walk(e.to, depth + 2);
        }
      });
    }
    onPath.delete(id);
  };
  starts.forEach((s) => walk(s, 0));
  // Anything unreachable from a start (e.g. only in a cycle) still gets described.
  g.ids.filter((id) => !described.has(id)).forEach((id) => walk(id, 0));

  const pathText =
    paths >= 100
      ? "There are many different routes through it."
      : paths === 1
        ? "There is one route through it."
        : paths > 1
          ? `There are ${paths} different routes from start to finish.`
          : "";
  const takeaway = [
    decisions.length
      ? `The outcome depends on ${plural(decisions.length, "decision")}.`
      : splits.length
        ? ""
        : "The steps run in a fixed order.",
    pathText,
  ]
    .filter(Boolean)
    .join(" ");

  const shortAlt = sentence(
    `A flowchart with ${plural(n, "step")}${direction ? ` running ${direction}` : ""}. It begins at ${startText}${
      endText ? ` and ends at ${endText}` : ""
    }. ${takeaway}`
  );

  return {
    shortAlt,
    sections: {
      purpose: sentence(purposeBits.filter(Boolean).join(" ")),
      structure: sentence(structureBits.filter(Boolean).join(" ")),
      keyComponents: bullets(components),
      traversal: lines.join("\n"),
      mainTakeaway: takeaway,
    },
  };
}

// ---------- data structures (Arboretum representations) ----------

const val = (n: IRNode) => (n.value === "" ? n.id : n.value);

function describeTree(type: DiagramType, data: FlowchartData, title: string): AutoDescription {
  const diagram = toArboretumDiagram(type, data, title) as IRTree;
  const root = buildTree(diagram);
  if (!root || !diagram.nodes.length) return describeFlowchart(data, title);

  const real = (nodes: IRNode[]) => nodes.filter((n) => !PHANTOM_NODE_IDS.includes(n.id.toLowerCase()));
  // Arboretum pads binary trees with invisible placeholder children, so measure the real nodes.
  const levels = new Map<number, number>();
  const measure = (node: IRNode, level: number) => {
    levels.set(level, (levels.get(level) ?? 0) + 1);
    real(node.children ?? []).forEach((c) => measure(c, level + 1));
  };
  measure(root, 1);
  const depth = levels.size;
  const breadth = Math.max(...levels.values());
  const nodeCount = [...levels.values()].reduce((a, b) => a + b, 0);
  const leaves: string[] = [];
  const collect = (node: IRNode) => {
    const kids = real(node.children ?? []);
    if (!kids.length) leaves.push(val(node));
    kids.forEach(collect);
  };
  collect(root);

  const base = sentence(generateTreeDescription(diagram));
  const kidsOfRoot = real(root.children ?? []).map(val);
  const pre = real(traversePreOrder(root)).map(val);
  const post = real(traversePostOrder(root)).map(val);
  const inord = type === "bt" ? real(traverseInOrder(root)).map(val) : [];

  const parentOf = new Map<string, string>();
  for (const e of diagram.edges) if (!parentOf.has(e.child)) parentOf.set(e.child, e.parent);
  const nameOf = new Map(diagram.nodes.map((n) => [n.id, val(n)]));

  const keyBits = [
    `Root: ${q(val(root))}${kidsOfRoot.length ? `, with ${plural(kidsOfRoot.length, "child", "children")}: ${list(kidsOfRoot.map(q))}` : ""}`,
    `Leaves (nodes with no children): ${list(leaves.map(q))}`,
    `Depth: ${plural(depth, "level")}. Widest level: ${plural(breadth, "node")}.`,
  ];

  const traversal = [
    `Pre-order (parent first, then children): ${list(pre.map(q))}`,
    inord.length ? `In-order (left, parent, right): ${list(inord.map(q))}` : "",
    `Post-order (children first, then parent): ${list(post.map(q))}`,
  ].filter(Boolean);

  const parentLines = real(diagram.nodes)
    .filter((n) => n.id !== root.id && parentOf.has(n.id))
    .map((n) => `${q(val(n))} is a child of ${q(nameOf.get(parentOf.get(n.id) ?? "") ?? "")}`);

  return {
    shortAlt: sentence(`${base} It is ${plural(depth, "level")} deep.`),
    sections: {
      purpose: title
        ? `This ${diagramTypeLabel(type).toLowerCase()} is titled ${q(title)}.`
        : `This is a ${diagramTypeLabel(type).toLowerCase()}.`,
      structure: sentence(`${base} It is ${plural(depth, "level")} deep.`),
      keyComponents: bullets(keyBits),
      traversal: `${bullets(traversal)}\n\n${bullets(parentLines)}`.trim(),
      mainTakeaway: sentence(
        `${plural(nodeCount, "node")}, rooted at ${q(val(root))}, with ${plural(leaves.length, "leaf", "leaves")}.`
      ),
    },
  };
}

function describeLinkedList(data: FlowchartData, title: string): AutoDescription {
  const d = toArboretumDiagram("ll", data, title) as IRLinkedList;
  if (!d.nodes.length) return describeFlowchart(data, title);
  const values = d.nodes.map((n) => val(n));
  const base = sentence(generateLinkedListDescription(d));
  const chain = values.map(q).join(" → ");
  return {
    shortAlt: sentence(`${base} In order: ${list(values)}.`),
    sections: {
      purpose: title ? `This linked list is titled ${q(title)}.` : "This is a linked list.",
      structure: base,
      keyComponents: bullets([
        `Head (first node): ${q(values[0])}`,
        `Tail (last node): ${q(values[values.length - 1])}`,
        `Length: ${plural(values.length, "node")}`,
      ]),
      traversal: `Start at the head and follow each pointer to the next node: ${chain}.`,
      mainTakeaway: sentence(`A chain of ${plural(values.length, "node")} from ${q(values[0])} to ${q(values[values.length - 1])}.`),
    },
  };
}

function describeArray(type: DiagramType, data: FlowchartData, title: string): AutoDescription {
  const d = toArboretumDiagram(type, data, title) as IRArray;
  if (!d.elements.length) return describeFlowchart(data, title);
  const base = sentence(generateArrayDescription(d));

  if (type === "2arr") {
    const rows = d.elements.map((r) => (r.children ?? []).map((c) => c.value));
    return {
      shortAlt: sentence(`${base} Row by row: ${rows.map((r, i) => `row ${i + 1}: ${r.join(", ")}`).join("; ")}.`),
      sections: {
        purpose: title ? `This grid is titled ${q(title)}.` : "This is a 2D array, a grid of values.",
        structure: base,
        keyComponents: bullets(rows.map((r, i) => `Row ${i + 1}: ${r.join(", ")}`)),
        traversal: "Read the rows from top to bottom, and each row from left to right.",
        mainTakeaway: sentence(`A grid with ${plural(rows.length, "row")} and ${plural(rows[0]?.length ?? 0, "column")}.`),
      },
    };
  }

  const values = d.elements.map((e) => e.value);
  return {
    shortAlt: sentence(`${base} Values in order: ${list(values)}.`),
    sections: {
      purpose: title ? `This array is titled ${q(title)}.` : "This is an array, a row of values.",
      structure: base,
      keyComponents: bullets(values.map((v, i) => `Position ${i}: ${v}`)),
      traversal: "Read the values from left to right, starting at position 0.",
      mainTakeaway: sentence(`${plural(values.length, "value")}, from ${q(values[0])} to ${q(values[values.length - 1])}.`),
    },
  };
}

/**
 * A description computed from the diagram alone (no AI, no network): the same facts every
 * time, and it works offline. Plain flowcharts are analysed as graphs; data-structure types
 * use Arboretum's descriptions and add depth, traversal orders and per-node detail.
 */
export function autoDescribe(type: DiagramType, data: FlowchartData, title = ""): AutoDescription {
  if (type === "flowchart") return describeFlowchart(data, title);
  if (isTreeType(type)) return describeTree(type, data, title);
  if (type === "ll") return describeLinkedList(data, title);
  return describeArray(type, data, title);
}

// ---------- does the diagram look like the chosen type? ----------

/** Plain-language problems between the diagram's shape and the type the author picked. */
export function checkDiagramType(type: DiagramType, data: FlowchartData): string[] {
  if (type === "flowchart" || !data.nodes.length) return [];
  const g = buildGraph(data);
  const problems: string[] = [];
  const roots = g.ids.filter((id) => g.incoming.get(id)!.length === 0);
  const multiParent = g.ids.filter((id) => g.incoming.get(id)!.length > 1);
  const branching = g.ids.filter((id) => g.out.get(id)!.length > 1);

  if (isTreeType(type)) {
    if (roots.length !== 1) problems.push(`A tree has one root, but this has ${roots.length} nodes with no parent.`);
    if (multiParent.length) problems.push(`A tree node has one parent, but ${plural(multiParent.length, "node")} ${multiParent.length === 1 ? "has" : "have"} more than one.`);
    if (hasCycle(g)) problems.push("A tree has no loops, but arrows here lead back to an earlier node.");
    if (type === "bt" && g.ids.some((id) => g.out.get(id)!.length > 2)) {
      problems.push("A binary tree node has at most two children.");
    }
  } else if (type === "ll") {
    if (branching.length) problems.push("A linked list is a single chain, but some nodes point to more than one node.");
    if (multiParent.length) problems.push("A linked list node is pointed to by one node, but some have more than one.");
  } else if (data.edges.length) {
    problems.push("Arrays are shown by position, so arrows are ignored.");
  }
  return problems;
}
