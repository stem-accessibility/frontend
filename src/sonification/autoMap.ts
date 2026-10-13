// src/sonification/autoMap.ts
import type { ParsedDataset, SonificationConfig, SonificationPresetId } from "../types/types";
import { PRESET_COLUMN_REQUIREMENTS } from "./presets";
import { detectColumnType } from "../services/datasetUtils";

// Column names that usually hold the time or sequence axis.
const TIME_LIKE =
  /^(time|date|datetime|timestamp|t|x|index|step|year|month|day|week|hour|minute|second|period)$/i;

/**
 * Chooses columns for a preset.
 *
 * valueColumn is what is plotted and sonified (pitch, the y axis). timeColumn is the sequence
 * axis (time, or x for a scatterplot). categoryColumn holds the labels of bars and slices.
 *
 * Every field the preset does not use is returned as null, so a column chosen for an earlier
 * preset or dataset can never linger and point at a column that is not in this dataset.
 * A null timeColumn means "use row position".
 */
export function autoMapColumnsForPreset(
  dataset: ParsedDataset,
  presetId: SonificationPresetId
): Partial<SonificationConfig> {
  const req = PRESET_COLUMN_REQUIREMENTS[presetId];

  const numericCols = dataset.columns.filter(
    (c) => detectColumnType(dataset.rows, c) === "numeric"
  );
  const catCols = dataset.columns.filter(
    (c) => detectColumnType(dataset.rows, c) === "categorical"
  );

  const config: Partial<SonificationConfig> = {
    preset: presetId,
    valueColumn: null,
    timeColumn: null,
    categoryColumn: null,
  };

  if (req.needsTime && req.needsValue) {
    // Time first, value second, unless a column is named like a time axis.
    const timeIdx = Math.max(0, numericCols.findIndex((c) => TIME_LIKE.test(c)));
    if (numericCols.length >= 2) {
      config.timeColumn = numericCols[timeIdx];
      config.valueColumn = numericCols.find((_, i) => i !== timeIdx) ?? null;
    } else {
      // One numeric column: plot it against row position.
      config.valueColumn = numericCols[0] ?? null;
    }
  } else if (req.needsX && req.needsY) {
    // Scatter: x is the timeColumn slot, y is the valueColumn slot.
    if (numericCols.length >= 2) {
      config.timeColumn = numericCols[0];
      config.valueColumn = numericCols[1];
    } else {
      config.valueColumn = numericCols[0] ?? null;
    }
  } else if (req.needsValue) {
    config.valueColumn = numericCols[0] ?? null;
  }

  if (req.needsCategory) {
    config.categoryColumn = catCols[0] ?? null;
  }

  return config;
}
