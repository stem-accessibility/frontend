import { describe, expect, it } from "vitest";
import { inlineRows, parseSpecText, planData, rowsToDataset, specForStorage, specTitle } from "./vegaLiteSpec";

const ok = (o: unknown) => parseSpecText(JSON.stringify(o));

describe("parseSpecText", () => {
  it("rejects text that is not JSON, not an object, or not Vega-Lite", () => {
    expect(parseSpecText("{nope")).toHaveProperty("error");
    expect(parseSpecText("[1,2]")).toHaveProperty("error");
    expect(ok({ foo: 1 })).toHaveProperty("error");
    expect(ok({ $schema: "https://vega.github.io/schema/vega/v5.json", mark: "bar" })).toHaveProperty("error");
  });
  it("accepts a Vega-Lite spec with or without $schema", () => {
    expect(ok({ mark: "bar" })).toHaveProperty("spec");
    expect(ok({ $schema: "https://vega.github.io/schema/vega-lite/v5.json", layer: [] })).toHaveProperty("spec");
  });
});

describe("planData", () => {
  it("is inline when values or a named dataset are in the file", () => {
    expect(planData({ mark: "bar", data: { values: [{ a: 1 }] } })).toEqual({ kind: "inline" });
    expect(planData({ mark: "bar", data: { name: "d" }, datasets: { d: [{ a: 1 }] } })).toEqual({ kind: "inline" });
  });
  it("needs rows when the top-level data is a url, missing, or an unknown name", () => {
    expect(planData({ mark: "bar", data: { url: "https://example.com/x.csv" } })).toEqual({ kind: "needs-rows" });
    expect(planData({ mark: "bar" })).toEqual({ kind: "needs-rows" });
    expect(planData({ mark: "bar", data: { name: "missing" } })).toEqual({ kind: "needs-rows" });
  });
  it("refuses to fetch urls hidden inside layers or lookups", () => {
    const layered = { data: { values: [{ a: 1 }] }, layer: [{ data: { url: "https://example.com/y.json" }, mark: "line" }] };
    expect(planData(layered)).toMatchObject({ kind: "unsupported" });
    const lookup = {
      data: { values: [{ a: 1 }] },
      mark: "bar",
      transform: [{ lookup: "a", from: { data: { url: "https://example.com/z.csv" }, key: "a" } }],
    };
    expect(planData(lookup)).toMatchObject({ kind: "unsupported" });
  });
});

describe("inlineRows / rowsToDataset", () => {
  it("reads tabular values and ignores non-tabular ones", () => {
    expect(inlineRows({ data: { values: [{ a: 1 }, { a: 2 }] } })).toHaveLength(2);
    expect(inlineRows({ data: { values: [1, 2, 3] } })).toBeNull();
    expect(inlineRows({ data: { values: [] } })).toBeNull();
  });
  it("builds a dataset with the union of columns and stringified objects", () => {
    const d = rowsToDataset([{ a: 1, b: "x" }, { a: 2, c: { n: 1 }, b: "" }], "spec.json");
    expect(d.columns).toEqual(["a", "b", "c"]);
    expect(d.rows).toEqual([
      { a: 1, b: "x", c: null },
      { a: 2, b: null, c: '{"n":1}' },
    ]);
    expect(d.name).toBe("spec.json");
  });
});

describe("specTitle", () => {
  it("reads string, object and multi-line titles", () => {
    expect(specTitle({ title: "Sales" })).toBe("Sales");
    expect(specTitle({ title: { text: "Sales by region", subtitle: "2025" } })).toBe("Sales by region");
    expect(specTitle({ title: { text: ["Sales", "by region"] } })).toBe("Sales by region");
    expect(specTitle({ title: "  " })).toBeUndefined();
    expect(specTitle({})).toBeUndefined();
  });
});

describe("specForStorage", () => {
  it("drops a top-level data url, because the rows come from the chart's own table", () => {
    const stored = specForStorage({ mark: "bar", data: { url: "https://example.com/x.csv" }, encoding: {} });
    expect(stored).toEqual({ mark: "bar", encoding: {} });
  });
  it("leaves specs with their own values alone", () => {
    const spec = { mark: "bar", data: { values: [{ a: 1 }] } };
    expect(specForStorage(spec)).toBe(spec);
  });
});
