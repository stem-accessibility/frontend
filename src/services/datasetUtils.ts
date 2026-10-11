export function detectColumnType(rows: any[], col: string) {
  let numericCount = 0;
  let nonEmptyCount = 0;

  for (const row of rows.slice(0, 20)) {
    const v = row[col];
    if (v === null || v === undefined) continue;

    nonEmptyCount++;
    if (typeof v === "number" || (!isNaN(Number(v)))) numericCount++;
  }

  if (numericCount / Math.max(1, nonEmptyCount) > 0.8) return "numeric";
  return "categorical";
}
