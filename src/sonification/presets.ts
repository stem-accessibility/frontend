import type { SonificationPresetId } from "../types/types";

export interface PresetColumnRequirements {
  needsTime: boolean;
  needsValue: boolean;
  needsX: boolean;
  needsY: boolean;
  needsCategory: boolean;
}

export const PRESET_COLUMN_REQUIREMENTS: Record<
  SonificationPresetId,
  PresetColumnRequirements
> = {
  line:           { needsTime: true,  needsValue: true,  needsX: false, needsY: false, needsCategory: false },
  bar:            { needsTime: false, needsValue: true,  needsX: false, needsY: false, needsCategory: true },
  // A histogram's bars are labelled by its bins, which sit in a category column.
  histogram:      { needsTime: false, needsValue: true,  needsX: false, needsY: false, needsCategory: true },
  scatter_spatial:{ needsTime: false, needsValue: false, needsX: true,  needsY: true,  needsCategory: false },
  scatter_temporal:{needsTime: true, needsValue: true,  needsX: false, needsY: false, needsCategory: false },
  pie:            { needsTime: false, needsValue: true,  needsX: false, needsY: false, needsCategory: true },
  boxplot:        { needsTime: false, needsValue: true,  needsX: false, needsY: false, needsCategory: true },
};
