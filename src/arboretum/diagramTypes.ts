/**
 * What kind of thing a diagram is. "flowchart" is the default (and what the image
 * pipeline produces). The data-structure types come from Arboretum
 * (https://github.com/ritesh-kanchi/Arboretum) and use its renderers and descriptions.
 */
export type DiagramType = "flowchart" | "tree" | "bt" | "ll" | "arr" | "2arr";

export const DIAGRAM_TYPES: { value: DiagramType; label: string; hint: string }[] = [
  {
    value: "flowchart",
    label: "Flowchart",
    hint: "Steps and decisions connected by arrows.",
  },
  {
    value: "tree",
    label: "Tree",
    hint: "One root; every other node has exactly one parent.",
  },
  {
    value: "bt",
    label: "Binary tree",
    hint: "A tree where each node has at most two children (left, right).",
  },
  {
    value: "ll",
    label: "Linked list",
    hint: "Nodes in a single chain, each pointing to the next.",
  },
  {
    value: "arr",
    label: "Array",
    hint: "A row of values. Order is left to right.",
  },
  {
    value: "2arr",
    label: "2D array",
    hint: "A grid of values in rows and columns.",
  },
];

const VALID = new Set<string>(DIAGRAM_TYPES.map((t) => t.value));

/** Anything unknown or missing (including older saved diagrams) is a flowchart. */
export function normalizeDiagramType(raw?: string | null): DiagramType {
  const v = (raw ?? "").toLowerCase();
  return VALID.has(v) ? (v as DiagramType) : "flowchart";
}

export function diagramTypeLabel(type: DiagramType): string {
  return DIAGRAM_TYPES.find((t) => t.value === type)?.label ?? "Flowchart";
}

export const isDataStructure = (type: DiagramType) => type !== "flowchart";
export const isTreeType = (type: DiagramType) => type === "tree" || type === "bt";
export const isArrayType = (type: DiagramType) => type === "arr" || type === "2arr";
