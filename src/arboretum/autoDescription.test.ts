import { describe, expect, it } from "vitest";
import { autoDescribe, checkDiagramType } from "./autoDescription";
import { parseMermaidText } from "../lib/mermaidText";

const parse = (t: string) => parseMermaidText(t).data;

describe("autoDescribe", () => {
  it("is deterministic and mentions decisions in flowcharts", () => {
    const d = parse("flowchart TD\n A([Start]) --> B{Ready?}\n B -- Yes --> C[Go]\n B -- No --> D[Wait]");
    const a = autoDescribe("flowchart", d, "Launch");
    const b = autoDescribe("flowchart", d, "Launch");
    expect(a).toEqual(b);
    expect(a.shortAlt.length).toBeGreaterThan(10);
    expect(JSON.stringify(a.sections)).toMatch(/Ready\?/);
  });

  it("describes a binary tree as a tree", () => {
    const d = parse("flowchart TD\n A((8)) --> B((3))\n A --> C((10))");
    const r = autoDescribe("bt", d, "");
    expect(r.shortAlt.toLowerCase()).toContain("binary tree");
  });

  it("handles an empty diagram without throwing", () => {
    const r = autoDescribe("flowchart", { nodes: [], edges: [] }, "");
    expect(r.shortAlt).toMatch(/empty/i);
  });
});

describe("checkDiagramType", () => {
  it("accepts a real tree and flags a node with two parents", () => {
    const tree = parse("flowchart TD\n A --> B\n A --> C");
    expect(checkDiagramType("tree", tree)).toEqual([]);
    const notTree = parse("flowchart TD\n A --> C\n B --> C");
    expect(checkDiagramType("tree", notTree).length).toBeGreaterThan(0);
  });

  it("flags a binary tree with three children", () => {
    const d = parse("flowchart TD\n A --> B\n A --> C\n A --> D");
    expect(checkDiagramType("bt", d).length).toBeGreaterThan(0);
  });

  it("never complains about flowcharts", () => {
    const d = parse("flowchart TD\n A --> B\n B --> A");
    expect(checkDiagramType("flowchart", d)).toEqual([]);
  });
});
