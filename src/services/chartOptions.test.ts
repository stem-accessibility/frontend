import { describe, expect, it } from "vitest";
import { orderRowsByCategory, cleanLabel } from "./chartOptions";

const rows = [
  { c: "pear", n: 5 },
  { c: "apple", n: 12 },
  { c: "fig", n: 1 },
  { c: "apple", n: 3 },
];
const names = (r: { c: string }[]) => r.map((x) => x.c);

describe("orderRowsByCategory", () => {
  it("leaves file order alone", () => {
    expect(orderRowsByCategory(rows, "c", "n", "data")).toBe(rows);
    expect(orderRowsByCategory(rows, "c", "n", undefined)).toBe(rows);
  });
  it("sorts alphabetically and keeps rows of one category together", () => {
    expect(names(orderRowsByCategory(rows, "c", "n", "alpha"))).toEqual(["apple", "apple", "fig", "pear"]);
  });
  it("sorts by the summed value of each category", () => {
    // apple 15, pear 5, fig 1
    expect(names(orderRowsByCategory(rows, "c", "n", "value-desc"))).toEqual(["apple", "apple", "pear", "fig"]);
    expect(names(orderRowsByCategory(rows, "c", "n", "value-asc"))).toEqual(["fig", "pear", "apple", "apple"]);
  });
  it("sorts numbers inside names naturally", () => {
    const r = [{ c: "Week 10" }, { c: "Week 2" }, { c: "Week 1" }];
    expect(names(orderRowsByCategory(r, "c", null, "alpha"))).toEqual(["Week 1", "Week 2", "Week 10"]);
  });
  it("does nothing when the category column is missing from the data", () => {
    expect(orderRowsByCategory(rows, "nope", "n", "alpha")).toBe(rows);
  });
});

describe("cleanLabel", () => {
  it("trims and treats blank as unset", () => {
    expect(cleanLabel("  Temperature  ")).toBe("Temperature");
    expect(cleanLabel("   ")).toBeUndefined();
    expect(cleanLabel(null)).toBeUndefined();
  });
});
