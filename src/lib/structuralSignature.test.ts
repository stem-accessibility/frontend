import { describe, expect, it } from "vitest";
import { structuralSignature } from "./structuralSignature";
import type { FlowchartData } from "../types/types";

const base = (): FlowchartData => ({
  nodes: [
    { id: "A", label: "Start", shape: "rectangle", coordinates: [[0, 0], [100, 50]] },
    { id: "B", label: "End", shape: "rectangle", coordinates: [[0, 100], [100, 150]] },
  ],
  edges: [{ id: "e1", source: "A", destination: "B" }],
});

describe("structuralSignature", () => {
  it("does not change when the canvas fills in styling details on load", () => {
    const loaded = base();
    loaded.edges = [{ id: "e1", source: "A", destination: "B", type: "solid", arrowheads: ["end"] }];
    expect(structuralSignature(loaded)).toBe(structuralSignature(base()));
  });

  it("does not change when nodes are only moved", () => {
    const moved = base();
    moved.nodes[0].coordinates = [[300, 300], [400, 350]];
    expect(structuralSignature(moved)).toBe(structuralSignature(base()));
  });

  it("changes when a label changes", () => {
    const d = base();
    d.nodes[0].label = "Begin";
    expect(structuralSignature(d)).not.toBe(structuralSignature(base()));
  });

  it("changes when a shape changes", () => {
    const d = base();
    d.nodes[0].shape = "diamond";
    expect(structuralSignature(d)).not.toBe(structuralSignature(base()));
  });

  it("changes when an arrow is re-pointed", () => {
    const d = base();
    d.nodes.push({ id: "C", label: "Other", shape: "rectangle", coordinates: [[0, 200], [100, 250]] });
    const before = structuralSignature(d);
    d.edges[0].destination = "C";
    expect(structuralSignature(d)).not.toBe(before);
  });

  it("changes when a node or an arrow is added or removed", () => {
    const withExtra = base();
    withExtra.edges.push({ id: "e2", source: "B", destination: "A" });
    expect(structuralSignature(withExtra)).not.toBe(structuralSignature(base()));
    const fewer = base();
    fewer.nodes.pop();
    fewer.edges = [];
    expect(structuralSignature(fewer)).not.toBe(structuralSignature(base()));
  });

  it("does not depend on the order of nodes or edges", () => {
    const shuffled = base();
    shuffled.nodes.reverse();
    expect(structuralSignature(shuffled)).toBe(structuralSignature(base()));
  });
});
