// Lets the author say what the chart is called, what its axes mean, and (for category charts)
// in what order the categories read. These feed the visual chart, the data table, the navigable
// chart and the sonification title, so one description is used everywhere.
import { useId } from "react";
import type { SonificationConfig } from "../../types/types";
import { CATEGORY_ORDERS } from "../../services/chartOptions";

interface Props {
  config: SonificationConfig;
  onChange: (config: SonificationConfig) => void;
  /** Category order only makes sense when the chart has category labels. */
  showCategoryOrder: boolean;
  /** Names of the columns on each axis, shown as the default when a label is left blank. */
  xDefault: string;
  yDefault: string;
}

export function ChartOptionsPanel({ config, onChange, showCategoryOrder, xDefault, yDefault }: Props) {
  const id = useId();
  const set = (partial: Partial<SonificationConfig>) => onChange({ ...config, ...partial });

  return (
    <section className="card" aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`}>Chart options</h2>
      <p className="hint" id={`${id}-hint`}>
        Optional. These words are used in the chart, the data table and the navigable chart.
      </p>

      <label htmlFor={`${id}-title`}>Chart title</label>
      <input
        id={`${id}-title`}
        type="text"
        value={config.title ?? ""}
        onChange={(e) => set({ title: e.target.value })}
        aria-describedby={`${id}-hint`}
        placeholder="For example: Average temperature by month"
      />

      <label htmlFor={`${id}-x`}>Horizontal axis label</label>
      <input
        id={`${id}-x`}
        type="text"
        value={config.xLabel ?? ""}
        onChange={(e) => set({ xLabel: e.target.value })}
        placeholder={xDefault}
      />

      <label htmlFor={`${id}-y`}>Vertical axis label</label>
      <input
        id={`${id}-y`}
        type="text"
        value={config.yLabel ?? ""}
        onChange={(e) => set({ yLabel: e.target.value })}
        placeholder={yDefault}
      />

      {showCategoryOrder && (
        <>
          <label htmlFor={`${id}-order`}>Category order</label>
          <select
            id={`${id}-order`}
            value={config.categoryOrder ?? "data"}
            onChange={(e) => set({ categoryOrder: e.target.value as SonificationConfig["categoryOrder"] })}
          >
            {CATEGORY_ORDERS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </>
      )}
    </section>
  );
}
