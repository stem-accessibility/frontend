import { describe, expect, it, vi } from "vitest";

// The Erie player itself needs a browser audio context; only the spec builder is under test.
vi.mock("erie-web", () => ({}));

import { buildErieSpecFromConfig } from "./erieClient";

describe("buildErieSpecFromConfig", () => {
  const bars = {
    columns: ["category", "value"],
    rows: [
      { category: "A", value: 12 },
      { category: "B", value: 18 },
    ],
  };

  it("uses row order for time when there is no time column", () => {
    const spec: any = buildErieSpecFromConfig(bars, {
      preset: "bar",
      valueColumn: "value",
      timeColumn: null,
    });
    expect(spec.encoding.time.field).toBe("__time");
    expect(spec.data.values.map((r: any) => r.__time)).toEqual([0, 1]);
    expect(spec.description).toContain("row order is mapped to time");
  });

  it("uses the chosen time column when there is one", () => {
    const series = {
      columns: ["t", "v"],
      rows: [{ t: 5, v: 1 }, { t: 9, v: 2 }],
    };
    const spec: any = buildErieSpecFromConfig(series, {
      preset: "line",
      valueColumn: "v",
      timeColumn: "t",
    });
    expect(spec.encoding.time.field).toBe("t");
    expect(spec.data.values.map((r: any) => r.__time)).toEqual([5, 9]);
  });
});
