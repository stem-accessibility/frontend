// Plain HTML table of the uploaded chart data: the standard, keyboard- and screen-reader-friendly
// text equivalent of the chart. It stands alone, so it works without Olli.
import type { ParsedDataset } from "../../types/types";

const MAX_ROWS = 500;

type Props = {
  dataset: ParsedDataset;
  /** Short description of what the table shows, used as its caption. */
  caption: string;
};

const isNumeric = (v: unknown) =>
  typeof v === "number" || (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)));

export default function ChartDataTable({ dataset, caption }: Props) {
  const { columns, rows } = dataset;
  if (columns.length === 0 || rows.length === 0) return null;

  const shown = rows.slice(0, MAX_ROWS);
  // Right-align a column only when every shown value in it is a number.
  const numericCol = new Map(
    columns.map((c) => [c, shown.every((r) => r[c] === null || r[c] === "" || isNumeric(r[c]))])
  );

  return (
    <>
      {/* The wrapper scrolls on narrow screens, so it must be reachable and named for keyboard users. */}
      <div className="chart-table-scroll" role="region" aria-label={caption} tabIndex={0}>
        <table className="chart-table">
          <caption>
            {caption} ({rows.length} {rows.length === 1 ? "row" : "rows"})
          </caption>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c} scope="col" className={numericCol.get(c) ? "num" : undefined}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((row, i) => (
              <tr key={i}>
                {columns.map((c) => (
                  <td key={c} className={numericCol.get(c) ? "num" : undefined}>
                    {row[c] === null || row[c] === undefined ? "" : String(row[c])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > MAX_ROWS && (
        <p className="hint">
          Showing the first {MAX_ROWS} of {rows.length} rows.
        </p>
      )}
    </>
  );
}
