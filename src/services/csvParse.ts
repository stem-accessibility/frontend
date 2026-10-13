// Turns the rows Papa Parse produces (without header handling) into a ParsedDataset.
// Kept free of Papa and of the DOM so it can be unit tested with plain arrays.
import type { ParsedDataset, ParsedRow } from "../types/types";

export const MAX_CSV_ROWS = 2000;

export type CsvResult = {
  dataset: ParsedDataset;
  /** Rows beyond MAX_CSV_ROWS that were left out. */
  truncatedRows: number;
  /** True when the first line was treated as column names. */
  hadHeader: boolean;
  /** Leading lines that were shorter than the data (titles, notes) and were skipped. */
  skippedLeadingLines: number;
};

type Cell = unknown;

const isBlank = (c: Cell) => c === null || c === undefined || (typeof c === "string" && c.trim() === "");

function cleanCell(c: Cell): string | number | null {
  if (isBlank(c)) return null;
  if (typeof c === "number") return Number.isFinite(c) ? c : null;
  if (typeof c === "boolean") return c ? "true" : "false";
  return String(c).trim();
}

/** The most common row length, preferring the longer one on a tie. */
function modalWidth(rows: Cell[][]): number {
  const counts = new Map<number, number>();
  for (const r of rows) counts.set(r.length, (counts.get(r.length) ?? 0) + 1);
  let best = 0;
  let bestCount = -1;
  for (const [w, n] of counts) {
    if (n > bestCount || (n === bestCount && w > best)) {
      best = w;
      bestCount = n;
    }
  }
  return best;
}

function uniqueNames(raw: string[]): string[] {
  const seen = new Map<string, number>();
  return raw.map((name, i) => {
    const base = name.trim() || `Column ${i + 1}`;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return n === 1 ? base : `${base} (${n})`;
  });
}

export function datasetFromGrid(grid: Cell[][], name?: string): CsvResult {
  // Papa leaves a single empty cell for a blank line.
  const rows = grid.filter((r) => Array.isArray(r) && r.some((c) => !isBlank(c)));
  if (rows.length === 0) {
    return { dataset: { columns: [], rows: [], name }, truncatedRows: 0, hadHeader: false, skippedLeadingLines: 0 };
  }

  // A title or note above the table is shorter than the data rows; skip leading short lines.
  const width = modalWidth(rows);
  let start = 0;
  while (start < rows.length - 1 && rows[start].length < width) start++;
  const body = rows.slice(start);

  // The first line is a header when it is all text (no numbers). A file of only numbers has none.
  const first = body[0];
  const hadHeader =
    body.length > 0 &&
    first.every((c) => isBlank(c) || typeof c === "string") &&
    first.some((c) => !isBlank(c));
  const dataRows = hadHeader ? body.slice(1) : body;

  const colCount = Math.max(width, ...body.map((r) => r.length));
  const columns = uniqueNames(
    hadHeader
      ? Array.from({ length: colCount }, (_, i) => String(cleanCell(first[i]) ?? ""))
      : Array.from({ length: colCount }, () => "")
  );

  const objects: ParsedRow[] = dataRows.map((r) => {
    const o: ParsedRow = {};
    columns.forEach((c, i) => {
      o[c] = cleanCell(r[i]);
    });
    return o;
  });

  // A column with nothing in it (a trailing comma, say) only adds noise to the mapping menus.
  const keep = columns.filter((c) => objects.some((o) => o[c] !== null));
  const trimmed = objects.map((o) => Object.fromEntries(keep.map((c) => [c, o[c]])) as ParsedRow);

  const truncatedRows = Math.max(0, trimmed.length - MAX_CSV_ROWS);
  return {
    dataset: { columns: keep, rows: trimmed.slice(0, MAX_CSV_ROWS), name },
    truncatedRows,
    hadHeader,
    skippedLeadingLines: start,
  };
}
