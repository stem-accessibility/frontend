import { describe, expect, it } from "vitest";
import { toOlliSpec } from "./toOlliSpec";

const months = [
  { month: "Jan", temp: 3 },
  { month: "Feb", temp: "5" },
  { month: "Mar", temp: 9 },
];

describe("toOlliSpec", () => {
  it("returns null when there is nothing to describe", () => {
    expect(toOlliSpec({ rows: [], xField: "a", yField: "b", preset: "bar" })).toBeNull();
    expect(toOlliSpec({ rows: months, xField: "month", yField: null, preset: "bar" })).toBeNull();
    expect(toOlliSpec({ rows: [{ month: "Jan", temp: "n/a" }], xField: "month", yField: "temp", preset: "bar" })).toBeNull();
  });

  it("keeps categories in file order and coerces numeric strings", () => {
    const spec = toOlliSpec({ rows: months, xField: "month", yField: "temp", preset: "bar" });
    if (!spec || "operator" in spec) throw new Error("expected a unit spec");
    expect(spec.mark).toBe("bar");
    expect(spec.axes?.[0].ticks).toEqual(["Jan", "Feb", "Mar"]);
    expect(spec.data.map((d) => d.temp)).toEqual([3, 5, 9]);
    expect(spec.fields?.[0].type).toBe("ordinal");
  });

  it("lists a short numeric series point by point, in numeric order", () => {
    const rows = [{ time: 2, value: 20 }, { time: 0, value: 10 }, { time: 1, value: 15 }];
    const spec = toOlliSpec({ rows, xField: "time", yField: "value", preset: "line" });
    if (!spec || "operator" in spec) throw new Error("expected a unit spec");
    expect(spec.fields?.[0].type).toBe("ordinal");
    expect(spec.axes?.[0].ticks).toEqual([0, 1, 2]);
    expect(spec.mark).toBe("line");
  });

  it("keeps scatterplots and long series quantitative", () => {
    const pts = Array.from({ length: 40 }, (_, i) => ({ x: i, y: i * 2 }));
    const long = toOlliSpec({ rows: pts, xField: "x", yField: "y", preset: "line" });
    const scatter = toOlliSpec({ rows: pts.slice(0, 5), xField: "x", yField: "y", preset: "scatter_spatial" });
    for (const spec of [long, scatter]) {
      if (!spec || "operator" in spec) throw new Error("expected a unit spec");
      expect(spec.fields?.[0].type).toBe("quantitative");
      expect(spec.axes?.[0].ticks).toBeUndefined();
    }
  });

  it("falls back to row position when the x column is not in the data", () => {
    const rows = [{ category: "A", value: 12 }, { category: "B", value: 18 }];
    const spec = toOlliSpec({ rows, xField: "time", yField: "value", preset: "bar" });
    if (!spec || "operator" in spec) throw new Error("expected a unit spec");
    expect(spec.data).toEqual([{ Row: 1, value: 12 }, { Row: 2, value: 18 }]);
  });

  it("uses 1-based row position for __index and skips rows without a y value", () => {
    const rows = [{ v: 4 }, { v: "" }, { v: 8 }];
    const spec = toOlliSpec({ rows, xField: "__index", yField: "v", preset: "scatter_temporal" });
    if (!spec || "operator" in spec) throw new Error("expected a unit spec");
    expect(spec.data).toEqual([{ Row: 1, v: 4 }, { Row: 3, v: 8 }]);
    expect(spec.mark).toBe("point");
  });

  it("uses author-chosen axis titles and a title built from them", () => {
    const spec = toOlliSpec({
      rows: months, xField: "month", yField: "temp", preset: "bar",
      xLabel: "Month of 2025", yLabel: "Temperature (°C)",
    });
    if (!spec || "operator" in spec) throw new Error("expected a unit spec");
    expect(spec.title).toBe("Temperature (°C) by Month of 2025");
    expect(spec.axes?.map((a) => a.title)).toEqual(["Month of 2025", "Temperature (°C)"]);
  });
});
