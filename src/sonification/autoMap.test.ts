import { describe, expect, it } from "vitest";
import { autoMapColumnsForPreset } from "./autoMap";
import type { ParsedDataset } from "../types/types";

const ds = (columns: string[], rows: Record<string, string | number>[]): ParsedDataset => ({
  columns,
  rows,
});

const series = ds(["time", "value"], [
  { time: 0, value: 10 },
  { time: 1, value: 20 },
  { time: 2, value: 15 },
]);

describe("autoMapColumnsForPreset", () => {
  it("line: time is the sequence axis and value is what is plotted", () => {
    const c = autoMapColumnsForPreset(series, "line");
    expect(c).toMatchObject({ timeColumn: "time", valueColumn: "value", categoryColumn: null });
  });

  it("line: finds the time column by name wherever it sits", () => {
    const reversed = ds(["value", "time"], [{ value: 10, time: 0 }, { value: 20, time: 1 }]);
    const c = autoMapColumnsForPreset(reversed, "line");
    expect(c).toMatchObject({ timeColumn: "time", valueColumn: "value" });
  });

  it("line: with no time-like name, the first numeric column is time", () => {
    const plain = ds(["alpha", "beta"], [{ alpha: 1, beta: 5 }, { alpha: 2, beta: 6 }]);
    expect(autoMapColumnsForPreset(plain, "line")).toMatchObject({
      timeColumn: "alpha",
      valueColumn: "beta",
    });
  });

  it("line: a single numeric column is plotted against row position", () => {
    const one = ds(["reading"], [{ reading: 3 }, { reading: 4 }]);
    expect(autoMapColumnsForPreset(one, "line")).toMatchObject({
      timeColumn: null,
      valueColumn: "reading",
    });
  });

  it("scatter: x goes in the timeColumn slot and y in valueColumn", () => {
    const pts = ds(["x", "y"], [{ x: 1, y: 2 }, { x: 2, y: 4 }]);
    expect(autoMapColumnsForPreset(pts, "scatter_spatial")).toMatchObject({
      timeColumn: "x",
      valueColumn: "y",
    });
  });

  it.each(["bar", "pie", "histogram"] as const)(
    "%s: labels come from the category column and time is cleared",
    (preset) => {
      const cats = ds(["label", "n"], [{ label: "A", n: 12 }, { label: "B", n: 18 }]);
      expect(autoMapColumnsForPreset(cats, preset)).toMatchObject({
        categoryColumn: "label",
        valueColumn: "n",
        timeColumn: null,
      });
    }
  );

  it("always names every column field, so stale ones are overwritten", () => {
    const c = autoMapColumnsForPreset(series, "bar");
    expect(c).toHaveProperty("timeColumn", null);
    expect(c).toHaveProperty("categoryColumn", null); // no categorical column in this file
  });
});
