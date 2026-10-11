// src/sonification/autoMap.ts
import type { ParsedDataset, SonificationConfig, SonificationPresetId } from "../types/types";
import { PRESET_COLUMN_REQUIREMENTS } from "./presets";
import { detectColumnType } from "../services/datasetUtils";

export function autoMapColumnsForPreset(
  dataset: ParsedDataset,
  presetId: SonificationPresetId
): Partial<SonificationConfig> {
  const req = PRESET_COLUMN_REQUIREMENTS[presetId];  // ✅ now valid

  const numericCols = dataset.columns.filter(
    (c) => detectColumnType(dataset.rows, c) === "numeric"
  );
  const catCols = dataset.columns.filter(
    (c) => detectColumnType(dataset.rows, c) === "categorical"
  );

  const config: Partial<SonificationConfig> = { preset: presetId };

  if (req.needsValue) {
    config.valueColumn = numericCols[0] ?? null;
  }
  if (req.needsTime) {
    config.timeColumn = numericCols[1] ?? numericCols[0] ?? null;
  }
  if (req.needsX) {
    config.timeColumn = numericCols[0] ?? null; // treat as X for scatter
  }
  if (req.needsY) {
    config.valueColumn = numericCols[1] ?? numericCols[0] ?? null; // treat as Y
  }
  if ((req as any).needsCategory) {
    // only if you’ve added categoryColumn to SonificationConfig
    (config as any).categoryColumn = catCols[0] ?? null;
  }

  return config;
}
