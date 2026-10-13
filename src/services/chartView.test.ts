import { describe, expect, it } from "vitest";
import { buildChartView } from "./chartView";
import type { ParsedDataset, SonificationConfig } from "../types/types";

const data: ParsedDataset = {
  columns: ["fruit", "n"],
  rows: [
    { fruit: "pear", n: 5 },
    { fruit: "apple", n: 12 },
    { fruit: "fig", n: 1 },
  ],
};
const base: SonificationConfig = { preset: "bar", valueColumn: "n", categoryColumn: "fruit", timeColumn: null };

describe("buildChartView", () => {
  it("keeps file order by default and numbers rows for the visual chart", () => {
    const v = buildChartView(data, base);
    expect(v.orderedRows.map((r) => r.fruit)).toEqual(["pear", "apple", "fig"]);
    expect(v.chartRows.map((r) => r.__index)).toEqual([0, 1, 2]);
    expect(v.categoryField).toBe("fruit");
    expect(v.needsCategory).toBe(true);
  });

  it("applies category order, labels and title to rows and the outline", () => {
    const v = buildChartView(data, {
      ...base,
      categoryOrder: "value-desc",
      title: " Fruit sold ",
      xLabel: "Fruit",
      yLabel: "Units",
    });
    expect(v.orderedRows.map((r) => r.fruit)).toEqual(["apple", "pear", "fig"]);
    expect(v.title).toBe("Fruit sold");
    const spec = v.olliSpec;
    if (!spec || "operator" in spec) throw new Error("expected a unit spec");
    expect(spec.title).toBe("Fruit sold");
    expect(spec.axes?.map((a) => a.title)).toEqual(["Fruit", "Units"]);
    expect(spec.axes?.[0].ticks).toEqual(["apple", "pear", "fig"]);
  });

  it("ignores a leftover category order on charts that have no categories", () => {
    const series: ParsedDataset = { columns: ["t", "v"], rows: [{ t: 2, v: 1 }, { t: 1, v: 9 }] };
    const v = buildChartView(series, { preset: "line", timeColumn: "t", valueColumn: "v", categoryOrder: "value-desc" });
    expect(v.orderedRows.map((r) => r.t)).toEqual([2, 1]);
    expect(v.needsCategory).toBe(false);
  });
});
