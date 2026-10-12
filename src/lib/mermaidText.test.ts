import { describe, expect, it } from "vitest";
import { MARKDOWN_EXAMPLES, parseMermaidText } from "./mermaidText";

const ids = (r: ReturnType<typeof parseMermaidText>) => r.data.nodes.map((n) => n.id);
const edges = (r: ReturnType<typeof parseMermaidText>) =>
  r.data.edges.map((e) => `${e.source}>${e.destination}${e.label ? `(${e.label})` : ""}`);

describe("parseMermaidText: flowcharts", () => {
  it("reads nodes, shapes, and labelled links", () => {
    const r = parseMermaidText(`flowchart TD
      A([Start]) --> B{Ready?}
      B -- Yes --> C[Go]
      B -->|No| D[Wait]`);
    expect(r.error).toBeNull();
    expect(Object.fromEntries(r.data.nodes.map((n) => [n.id, [n.label, n.shape]]))).toEqual({
      A: ["Start", "round-rectangle"],
      B: ["Ready?", "diamond"],
      C: ["Go", "rectangle"],
      D: ["Wait", "rectangle"],
    });
    expect(edges(r)).toEqual(["A>B", "B>C(Yes)", "B>D(No)"]);
  });

  it("reads chained links on one line (the backend parser dropped these)", () => {
    const r = parseMermaidText("flowchart LR\n A((1)) --> B((2)) --> C((3))");
    expect(ids(r)).toEqual(["A", "B", "C"]);
    expect(edges(r)).toEqual(["A>B", "B>C"]);
    expect(r.data.nodes.every((n) => n.shape === "circle")).toBe(true);
  });

  it("uses accTitle or title as the title and does not make it a node", () => {
    const r = parseMermaidText("flowchart TD\n accTitle: My tree\n A --> B");
    expect(r.title).toBe("My tree");
    expect(ids(r)).toEqual(["A", "B"]);
  });

  it("keeps a node's label when it is mentioned again by id", () => {
    const r = parseMermaidText("flowchart TD\n A[First step]\n A --> B[Second]\n B --> A");
    expect(r.data.nodes.find((n) => n.id === "A")?.label).toBe("First step");
  });

  it("ignores comments, semicolons, and style lines", () => {
    const r = parseMermaidText(
      "flowchart TD %% a comment\n A --> B; B --> C\n classDef x fill:#fff\n style A fill:#000"
    );
    expect(edges(r)).toEqual(["A>B", "B>C"]);
    expect(r.warnings).toEqual([]);
  });

  it("strips quotes and line breaks from labels", () => {
    const r = parseMermaidText('flowchart TD\n A["Say <br/> hello"] --> B["Two  words"]');
    expect(r.data.nodes.map((n) => n.label)).toEqual(["Say hello", "Two words"]);
  });

  it("gives every node coordinates and every edge an id", () => {
    const r = parseMermaidText("flowchart TD\n A --> B");
    for (const n of r.data.nodes) {
      expect(n.coordinates[1][0]).toBeGreaterThan(n.coordinates[0][0]);
      expect(n.coordinates[1][1]).toBeGreaterThan(n.coordinates[0][1]);
    }
    expect(r.data.edges[0].id).toBe("edge-0");
  });

  it("lays out top to bottom for TD and left to right for LR", () => {
    const td = parseMermaidText("flowchart TD\n A --> B");
    const lr = parseMermaidText("flowchart LR\n A --> B");
    const [a1, b1] = td.data.nodes.map((n) => n.coordinates[0]);
    const [a2, b2] = lr.data.nodes.map((n) => n.coordinates[0]);
    expect(b1[1]).toBeGreaterThan(a1[1]);
    expect(b2[0]).toBeGreaterThan(a2[0]);
  });

  it("reports empty input and input with no nodes, without throwing", () => {
    expect(parseMermaidText("").error).toMatch(/preview/i);
    expect(parseMermaidText("flowchart TD").error).toMatch(/No nodes/);
  });

  it("warns about lines it cannot read but still returns the rest", () => {
    const r = parseMermaidText("flowchart TD\n A --> B\n !!! nonsense ???");
    expect(r.error).toBeNull();
    expect(ids(r)).toContain("B");
    expect(r.warnings.length).toBeGreaterThan(0);
  });
});

describe("parseMermaidText: arrays (block-beta)", () => {
  it("reads a single row of values", () => {
    const r = parseMermaidText('block-beta\n a["4"] b["8"] c["15"]');
    expect(r.data.nodes.map((n) => n.label)).toEqual(["4", "8", "15"]);
    expect(r.data.edges).toEqual([]);
    const ys = new Set(r.data.nodes.map((n) => n.coordinates[0][1]));
    expect(ys.size).toBe(1);
  });

  it("wraps into rows by `columns`", () => {
    const r = parseMermaidText('block-beta\n columns 3\n a["1"] b["2"] c["3"]\n d["4"] e["5"] f["6"]');
    const rows = new Set(r.data.nodes.map((n) => n.coordinates[0][1]));
    expect(rows.size).toBe(2);
    expect(r.data.nodes[3].coordinates[0][0]).toBe(r.data.nodes[0].coordinates[0][0]);
  });
});

describe("starter examples", () => {
  it.each(Object.keys(MARKDOWN_EXAMPLES))("the %s example parses cleanly", (type) => {
    const r = parseMermaidText(MARKDOWN_EXAMPLES[type]);
    expect(r.error).toBeNull();
    expect(r.warnings).toEqual([]);
    expect(r.data.nodes.length).toBeGreaterThan(1);
  });
});
