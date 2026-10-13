// Everything a chart view needs, derived from the saved pieces (data + settings). The Charts page
// and the shared-link page both use this, so a chart reads the same in both places.
import type { OlliVisSpec } from "olli";
import type { ParsedDataset, SonificationConfig } from "../types/types";
import { toOlliSpec } from "../olli/toOlliSpec";
import { PRESET_COLUMN_REQUIREMENTS } from "../sonification/presets";
import { cleanLabel, orderRowsByCategory } from "./chartOptions";

export type ChartView = {
  /** Column holding bar/slice labels or the x axis, if any. */
  categoryField: string | null;
  needsCategory: boolean;
  /** Rows in the order the author chose for categories. */
  orderedRows: Record<string, string | number | null>[];
  /** The same rows with a row position, for the visual chart. */
  chartRows: Record<string, string | number | null>[];
  title?: string;
  xLabel?: string;
  yLabel?: string;
  /** The navigable outline from the column mapping (an uploaded specification replaces this). */
  olliSpec: OlliVisSpec | null;
};

export function buildChartView(dataset: ParsedDataset, config: SonificationConfig): ChartView {
  const req = PRESET_COLUMN_REQUIREMENTS[config.preset];
  // Category presets (bar, histogram, pie) keep their labels in categoryColumn.
  const categoryField = config.categoryColumn || config.timeColumn || null;
  // Category order only applies where the chart has category labels.
  const order = req?.needsCategory ? config.categoryOrder : "data";

  const orderedRows = orderRowsByCategory(dataset.rows, categoryField, config.valueColumn, order);
  const chartRows = orderedRows.map((row, index) => ({ __index: index, ...row }));

  const title = cleanLabel(config.title);
  const xLabel = cleanLabel(config.xLabel);
  const yLabel = cleanLabel(config.yLabel);

  return {
    categoryField,
    needsCategory: !!req?.needsCategory,
    orderedRows,
    chartRows,
    title,
    xLabel,
    yLabel,
    olliSpec: toOlliSpec({
      rows: orderedRows,
      xField: categoryField,
      yField: config.valueColumn,
      preset: config.preset,
      title,
      xLabel,
      yLabel,
    }),
  };
}
