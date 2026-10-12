import type { FlowchartData } from "../types/types";

/**
 * What counts as a change to the diagram's meaning: which nodes exist, their labels and shapes, and
 * which node points to which (with link labels). Visual styling such as line style is ignored, so
 * opening a saved STEM image is not reported as an edit just because the canvas normalizes it.
 */
export function structuralSignature(fc: FlowchartData) {
  const nodes = (fc.nodes ?? [])
    .map((n: any) => ({
      id: n.id,
      label: n.data?.label ?? n.label ?? "",
      shape: n.shape ?? n.data?.type ?? "",
    }))
    .sort((a, b) => String(a.id ?? "").localeCompare(String(b.id ?? "")));

  const edges = (fc.edges ?? [])
    .map((e: any) => ({
      id: e.id,
      source: e.source,
      target: e.target ?? e.destination,
      label: e.data?.label ?? e.label ?? "",
    }))
    .sort((a, b) => String(a.id ?? "").localeCompare(String(b.id ?? "")));

  return JSON.stringify({ nodes, edges });
}
