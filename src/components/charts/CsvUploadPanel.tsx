// src/components/charts/CsvUploadPanel.tsx
import React, { useId, useState } from "react";
import Papa from "papaparse";
import type { ParsedDataset } from "../../types/types";
import { datasetFromGrid, MAX_CSV_ROWS } from "../../services/csvParse";

interface Props {
  onDatasetLoaded: (data: ParsedDataset) => void;
}

type Status = { kind: "ok" | "error"; text: string } | null;

export function CsvUploadPanel({ onDatasetLoaded }: Props) {
  const inputId = useId();
  const [status, setStatus] = useState<Status>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;

    Papa.parse<unknown[]>(file, {
      header: false,
      dynamicTyping: true,
      skipEmptyLines: "greedy",
      complete: (results) => {
        const result = datasetFromGrid(results.data, file.name);
        const { dataset } = result;

        if (dataset.rows.length === 0 || dataset.columns.length === 0) {
          setStatus({
            kind: "error",
            text: `No data rows were found in ${file.name}. Check that it is a CSV with a header row and at least one row of values.`,
          });
        } else {
          const notes = [];
          if (result.skippedLeadingLines > 0) {
            notes.push(`skipped ${result.skippedLeadingLines} title ${result.skippedLeadingLines === 1 ? "line" : "lines"} above the table`);
          }
          if (!result.hadHeader) notes.push("no header row found, so columns are named Column 1, Column 2, and so on");
          if (result.truncatedRows > 0) {
            notes.push(`only the first ${MAX_CSV_ROWS} rows were used (${result.truncatedRows} left out)`);
          }
          setStatus({
            kind: "ok",
            text:
              `Loaded ${dataset.rows.length} ${dataset.rows.length === 1 ? "row" : "rows"} and ` +
              `${dataset.columns.length} ${dataset.columns.length === 1 ? "column" : "columns"} from ${file.name}` +
              (notes.length ? `; ${notes.join("; ")}.` : "."),
          });
          onDatasetLoaded(dataset);
        }
        // Allow choosing the same file again after fixing it.
        input.value = "";
      },
      error: (err) => {
        setStatus({ kind: "error", text: `Could not read ${file.name}: ${err.message}` });
        input.value = "";
      },
    });
  };

  return (
    <section className="card">
      <h2>Upload CSV</h2>
      <label htmlFor={inputId}>Choose a CSV file</label>{" "}
      <input id={inputId} type="file" accept=".csv,text/csv" onChange={handleFileChange} />
      <p className="hint">
        Expects column names in the first row. Up to {MAX_CSV_ROWS.toLocaleString()} rows are used.
      </p>
      {/* Polite for success, assertive for errors, so the result is announced either way. */}
      <p
        role={status?.kind === "error" ? "alert" : "status"}
        className={status?.kind === "error" ? "error-banner" : "hint"}
      >
        {status?.text ?? ""}
      </p>
    </section>
  );
}
