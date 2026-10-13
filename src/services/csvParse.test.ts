import { describe, expect, it } from "vitest";
import Papa from "papaparse";
import { datasetFromGrid, MAX_CSV_ROWS } from "./csvParse";

// Parse the way CsvUploadPanel does, so these tests cover Papa's typing as well.
const parse = (text: string, name = "t.csv") =>
  datasetFromGrid(
    Papa.parse<unknown[]>(text, { header: false, dynamicTyping: true, skipEmptyLines: "greedy" }).data,
    name
  );

describe("datasetFromGrid", () => {
  it("reads an ordinary CSV with a header row", () => {
    const r = parse("month,temp_c\nJan,3\nFeb,5\n");
    expect(r.dataset.columns).toEqual(["month", "temp_c"]);
    expect(r.dataset.rows).toEqual([
      { month: "Jan", temp_c: 3 },
      { month: "Feb", temp_c: 5 },
    ]);
    expect(r.hadHeader).toBe(true);
    expect(r.dataset.name).toBe("t.csv");
  });

  it("names columns when there is no header row", () => {
    const r = parse("1,10\n2,20\n");
    expect(r.hadHeader).toBe(false);
    expect(r.dataset.columns).toEqual(["Column 1", "Column 2"]);
    expect(r.dataset.rows).toHaveLength(2);
  });

  it("skips a title line above the table", () => {
    const r = parse("Table 1\ntime,value\n0,10\n1,20\n");
    expect(r.skippedLeadingLines).toBe(1);
    expect(r.dataset.columns).toEqual(["time", "value"]);
    expect(r.dataset.rows).toHaveLength(2);
  });

  it("keeps the old single-title layout working", () => {
    // The previous parser was written for a "Table 1" line followed by number pairs.
    const r = parse("Table 1\n0,10\n1,20\n2,15\n");
    expect(r.dataset.rows).toHaveLength(3);
    expect(r.dataset.columns).toHaveLength(2);
  });

  it("deduplicates and fills in blank column names", () => {
    const r = parse("a,a,\n1,2,3\n");
    expect(r.dataset.columns).toEqual(["a", "a (2)", "Column 3"]);
  });

  it("turns blanks into null and drops columns with nothing in them", () => {
    const r = parse("a,b,c\n1,,\n2,5,\n");
    expect(r.dataset.columns).toEqual(["a", "b"]);
    expect(r.dataset.rows).toEqual([{ a: 1, b: null }, { a: 2, b: 5 }]);
  });

  it("handles quoted commas, CRLF line endings and a BOM-free header", () => {
    const r = parse('city,note\r\n"Seattle, WA",rainy\r\n');
    expect(r.dataset.rows).toEqual([{ city: "Seattle, WA", note: "rainy" }]);
  });

  it("caps the number of rows and reports how many were left out", () => {
    const text = "n\n" + Array.from({ length: MAX_CSV_ROWS + 5 }, (_, i) => i).join("\n");
    const r = parse(text);
    expect(r.dataset.rows).toHaveLength(MAX_CSV_ROWS);
    expect(r.truncatedRows).toBe(5);
  });

  it("returns an empty dataset for an empty file", () => {
    const r = parse("\n\n");
    expect(r.dataset.columns).toEqual([]);
    expect(r.dataset.rows).toEqual([]);
  });
});
