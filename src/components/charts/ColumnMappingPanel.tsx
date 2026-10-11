// src/components/charts/ColumnMappingPanel.tsx

import type {
  ParsedDataset,
  SonificationConfig,
  SonificationPresetId,
} from "../../types/types";
import { PRESET_COLUMN_REQUIREMENTS } from "../../sonification/presets";
import { detectColumnType } from "../../services/datasetUtils";

interface Props {
  dataset: ParsedDataset;
  config: SonificationConfig;
  onChange: (config: SonificationConfig) => void;
}

export function ColumnMappingPanel({ dataset, config, onChange }: Props) {
  const presetId = config.preset as SonificationPresetId;
  const presetReq = PRESET_COLUMN_REQUIREMENTS[presetId];

  const numericCols = dataset.columns.filter(
    (c) => detectColumnType(dataset.rows, c) === "numeric"
  );

  const catCols = dataset.columns.filter(
    (c) => detectColumnType(dataset.rows, c) === "categorical"
  );

  const update = (partial: Partial<SonificationConfig>) =>
    onChange({ ...config, ...partial });

  return (
    <section className="card">
      <h2>Column Mapping</h2>
      <p className="hint">
        Based on the selected preset, only relevant columns are shown.
      </p>

      {presetReq.needsValue && (
        <label>
          Value column
          <select
            value={config.valueColumn ?? ""}
            onChange={(e) => update({ valueColumn: e.target.value || null })}
          >
            <option value="">Select…</option>
            {numericCols.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      )}

      {presetReq.needsTime && (
        <label>
          Time column
          <select
            value={config.timeColumn ?? ""}
            onChange={(e) => update({ timeColumn: e.target.value || null })}
          >
            <option value="">Select…</option>
            {numericCols.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      )}

      {presetReq.needsCategory && (
        <label>
          Category column
          <select
            value={(config as any).categoryColumn ?? ""}
            onChange={(e) =>
              update({ categoryColumn: e.target.value || null } as any)
            }
          >
            <option value="">Select…</option>
            {catCols.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      )}

      {presetReq.needsX && (
        <label>
          X column
          <select
            value={config.timeColumn ?? ""}
            onChange={(e) => update({ timeColumn: e.target.value || null })}
          >
            <option value="">Select…</option>
            {numericCols.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      )}

      {presetReq.needsY && (
        <label>
          Y column
          <select
            value={config.valueColumn ?? ""}
            onChange={(e) => update({ valueColumn: e.target.value || null })}
          >
            <option value="">Select…</option>
            {numericCols.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      )}
    </section>
  );
}
