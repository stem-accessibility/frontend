import { describe, expect, it } from "vitest";
import { chartFileKind } from "./chartFileKind";

describe("chartFileKind", () => {
  it("treats PNG, JPEG and WebP pictures as images", () => {
    expect(chartFileKind({ name: "a.png", type: "image/png" })).toBe("image");
    expect(chartFileKind({ name: "a.jpg", type: "image/jpeg" })).toBe("image");
    expect(chartFileKind({ name: "a.JPEG", type: "" })).toBe("image");
    expect(chartFileKind({ name: "a.webp", type: "image/webp" })).toBe("image");
  });

  it("treats CSV files as csv whatever type the system reports", () => {
    expect(chartFileKind({ name: "data.csv", type: "text/csv" })).toBe("csv");
    expect(chartFileKind({ name: "data.CSV", type: "" })).toBe("csv");
    expect(chartFileKind({ name: "data.csv", type: "application/vnd.ms-excel" })).toBe("csv");
  });

  it("refuses anything else", () => {
    expect(chartFileKind({ name: "notes.pdf", type: "application/pdf" })).toBeNull();
    expect(chartFileKind({ name: "anim.gif", type: "image/gif" })).toBeNull();
    expect(chartFileKind({ name: "data.xlsx", type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })).toBeNull();
    expect(chartFileKind({ name: "noextension", type: "" })).toBeNull();
  });

  it("does not let a picture's name make it a CSV or the reverse", () => {
    expect(chartFileKind({ name: "chart.csv.png", type: "image/png" })).toBe("image");
    expect(chartFileKind({ name: "image.png.csv", type: "text/csv" })).toBe("csv");
  });
});
