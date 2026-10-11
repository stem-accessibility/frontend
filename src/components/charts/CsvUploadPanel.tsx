// src/components/charts/CsvUploadPanel.tsx
import React from "react";
import type { ParsedDataset } from "../../types/types";
import Papa from "papaparse";

interface Props {
  onDatasetLoaded: (data: ParsedDataset) => void;
}

export function CsvUploadPanel({ onDatasetLoaded }: Props) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
  header: true,
  dynamicTyping: true,
  complete: (results) => {
    const rawRows = results.data as any[];

    const normalizedRows = rawRows
      .filter((row) => row && Object.keys(row).length > 0)
      .map((row, index) => {
        const base = row as any;

        // 1) Base index (for time if needed)
        const idx = index;

        // 2) If "__parsed_extra" exists, treat first entry as the "value"
        const extra = Array.isArray(base.__parsed_extra)
          ? base.__parsed_extra[0]
          : undefined;

        // 3) Coerce to numbers
        const time =
          typeof base["Table 1"] === "number"
            ? base["Table 1"]
            : Number(base["Table 1"]);
        const value =
          typeof extra === "number" ? extra : Number(extra);

        return {
          time: Number.isFinite(time) ? time : idx,
          value: Number.isFinite(value) ? value : null,
        };
      })
      .filter((row) => row.value !== null); // drop rows without numeric value

    onDatasetLoaded({
      columns: ["time", "value"],
      rows: normalizedRows,
      name: file.name,
    });
  },
});

  };

  return (
    <section className="card">
      <h2>Upload CSV</h2>
      <input type="file" accept=".csv" onChange={handleFileChange} />
      <p className="hint">Max ~2,000 rows for now.</p>
    </section>
  );
}
