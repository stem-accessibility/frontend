// src/pages/Charts.tsx
import React, { useState, useEffect, Suspense } from "react";
import type { ParsedDataset, SonificationConfig, SonificationState, SonificationPresetId } from "../types/types";
import { CsvUploadPanel } from "../components/charts/CsvUploadPanel";
import { ColumnMappingPanel } from "../components/charts/ColumnMappingPanel";
import { SonificationPlayer } from "../components/charts/SonificationPlayer";
import { PermalinkBar } from "../components/charts/PermalinkBar";
// import { useErieSonification } from "../hooks/useErieSonification"; // you'll create this
import VisualChart from "../components/charts/VisualChart";
import ChartDataTable from "../components/charts/ChartDataTable";
import {
  SONIFICATION_PRESETS,
  getChartTypeForPreset,
} from "../sonification/sonificationPresets";
import './styles/Charts.css';
import { autoMapColumnsForPreset } from "../sonification/autoMap";
import { toOlliSpec } from "../olli/toOlliSpec";

// Olli (and its styles) load only when a chart is shown, so they stay out of the main bundle.
const OlliView = React.lazy(() => import("../olli/OlliView"));
const DEFAULT_CONFIG: SonificationConfig = {
  timeColumn: "time",
  valueColumn: "value",
  preset: "line",
};

export default function Charts() {
  const [dataset, setDataset] = useState<ParsedDataset | null>(null);
  const [config, setConfig] = useState<SonificationConfig>(DEFAULT_CONFIG);
  const [sonificationState, setSonificationState] = useState<SonificationState | null>(null);
  const [isSavingPermalink, setIsSavingPermalink] = useState(false);
  const [error, setError] = useState<string | null>(null);
const [selectedPreset, setSelectedPreset] =
    useState<SonificationPresetId>("line");
   
  // TODO: if you support loading from an existing permalink, read it from route params here

  useEffect(() => {
  console.log("[Charts] Mounted");
}, []);

  const handleDatasetLoaded = (data: ParsedDataset) => {
    setDataset(data);
    setError(null);
    setConfig((prev) => ({
      ...prev,
      // Auto-pick the first numeric column as valueColumn if you want
      valueColumn: prev.valueColumn ?? guessFirstNumericColumn(data),
    }));
  };

  const handleConfigChange = (next: SonificationConfig) => {
    setConfig(next);
  };

  const handlePermalinkCreate = async () => {
    if (!dataset || !config.valueColumn) {
      setError("Upload a CSV and choose a value column before creating a permalink.");
      return;
    }

    try {
      setIsSavingPermalink(true);
      setError(null);

      // Build your Erie spec from dataset + config
      const erieSpec = buildErieSpecFromConfig(dataset, config);

      // Save to backend; backend returns an ID + createdAt etc.
      const res = await fetch("/api/sonifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataset, config, erieSpec }),
      });

      if (!res.ok) throw new Error("Failed to save permalink");

      const saved: SonificationState = await res.json();
      setSonificationState(saved);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong creating the permalink.");
    } finally {
      setIsSavingPermalink(false);
    }
  };

  const permalinkUrl = sonificationState
    ? `${window.location.origin}/charts/${sonificationState.id}`
    : null;

    const chartRows = React.useMemo(
  () =>
    dataset
      ? dataset.rows.map((row, index) => ({ __index: index, ...row }))
      : [],
  [dataset]
);

  const olliSpec = React.useMemo(
    () =>
      dataset
        ? toOlliSpec({
            rows: dataset.rows,
            // Category presets (bar, histogram, pie) keep their labels in categoryColumn.
            xField: config.categoryColumn || config.timeColumn,
            yField: config.valueColumn,
            preset: config.preset,
          })
        : null,
    [dataset, config.categoryColumn, config.timeColumn, config.valueColumn, config.preset]
  );

  const handlePresetSelect = (id: SonificationPresetId) => {
    setSelectedPreset(id);
    const preset = SONIFICATION_PRESETS[id];
    const exampleDataset = preset.exampleDataset;
    // If there's no uploaded dataset yet, load the example for this preset
   if (!dataset) {
    setDataset(exampleDataset);

    const autoConfig = autoMapColumnsForPreset(exampleDataset, id);
    setConfig((prev) => ({
      ...prev,
      ...autoConfig,
      preset: id,
    }));
    return;
  }
  const autoConfig = autoMapColumnsForPreset(dataset, id);
  setConfig((prev) => ({
    ...prev,
    ...autoConfig,
    preset: id,
  }));
};


  return (
    <main className="charts-page">
      <div className="charts-header">
        <h1>Audio Charts with <a href="https://see-mike-out.github.io/erie-editor/paper/">Erie</a></h1>
        <p>
          Upload a CSV, map your columns, and generate an Erie-based sonification
          with a shareable permalink.
        </p>
      </div>

      {error && (
        <div role="alert" className="error-banner">
          {error}
        </div>
      )}
          <section className="card" style={{ marginBottom: "1rem" }}>
        <h2>Chart type & preset</h2>
        <p className="hint">
          Choose a chart preset to see a built-in example. You can still upload
          your own CSV at any time.
        </p>

        <div className="preset-grid">
          {(
            Object.keys(SONIFICATION_PRESETS) as SonificationPresetId[]
          ).map((id) => {
            const preset = SONIFICATION_PRESETS[id];
            const isActive = id === selectedPreset;
            return (
              <button
                key={id}
                type="button"
                className={isActive ? "preset-card preset-card--active" : "preset-card"}
                onClick={() => handlePresetSelect(id)}
              >
                <h3>{preset.label}</h3>
              </button>
            );
          })}
        </div>

       {selectedPreset && (
  <div style={{ marginTop: "0.75rem" }}>
    <button
      type="button"
      onClick={() => {
        const preset = SONIFICATION_PRESETS[selectedPreset];
        const exampleDataset = preset.exampleDataset;

        setDataset(exampleDataset);

        const autoConfig = autoMapColumnsForPreset(exampleDataset, selectedPreset);
        setConfig((prev) => ({
          ...prev,
          ...autoConfig,
          preset: selectedPreset,
        }));
      }}
    >
      Use example data for {SONIFICATION_PRESETS[selectedPreset].label}
    </button>
  </div>
)}

      </section>

      <section className="charts-layout">
        {/* Left side: Upload + mapping */}
        <div className="charts-left">
          <CsvUploadPanel onDatasetLoaded={handleDatasetLoaded} />

          {dataset && (
            <ColumnMappingPanel
              dataset={dataset}
              config={config}
              onChange={handleConfigChange}
            />
          )}
        </div>

        {/* Right side: Sonification + permalink */}
        <div className="charts-right">
          <SonificationPlayer
            dataset={dataset}
            config={config}
            disabled={!dataset || !config.valueColumn}
          />
          {dataset && config.valueColumn && (
        <section className="card">
            <div className="charts-card-header">
          <h2>Visual chart</h2>
          
    </div>
    

          <VisualChart
            rows={chartRows}
            xField={config.timeColumn || "__index"}
            yField={config.valueColumn} // now guaranteed non-null
            chartType={getChartTypeForPreset(config.preset)}
          />
          
        </section>
      )}

          {dataset && dataset.rows.length > 0 && (
            <section className="card" aria-labelledby="chart-data-heading">
              <div className="charts-card-header">
                <h2 id="chart-data-heading">Data table</h2>
              </div>
              <ChartDataTable
                dataset={dataset}
                caption={dataset.name ? `Data from ${dataset.name}` : "Chart data"}
              />
            </section>
          )}

          {olliSpec && (
            <section className="card" aria-labelledby="navigable-chart-heading">
              <div className="charts-card-header">
                <h2 id="navigable-chart-heading">Navigable chart</h2>
              </div>
              <p className="hint">
                Explore the chart as a structured outline. Use the arrow keys to move: Up and
                Down change level, Left and Right move between items. Press ? for all keys and
                t to open the data as a table.
              </p>
              <Suspense fallback={<p role="status">Loading navigable chart…</p>}>
                <OlliView spec={olliSpec} label="Navigable chart" />
              </Suspense>
            </section>
          )}

          <PermalinkBar
            permalinkUrl={permalinkUrl}
            onCreatePermalink={handlePermalinkCreate}
            isSaving={isSavingPermalink}
            disabled={!dataset || !config.valueColumn}
          />
        </div>
      </section>
    </main>
  );
}

// Simple helper to pick a default numeric column
function guessFirstNumericColumn(dataset: ParsedDataset): string | null {
  const { columns, rows } = dataset;
  if (!rows.length) return null;

  for (const col of columns) {
    for (const row of rows.slice(0, 10)) {
      const value = row[col];
      if (typeof value === "number") return col;
      if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) {
        return col;
      }
    }
  }
  return null;
}

// Placeholder – you'll replace with real Erie spec construction
function buildErieSpecFromConfig(dataset: ParsedDataset, config: SonificationConfig) {
  // TODO: construct Erie grammar object here
  return { datasetName: dataset.name ?? "uploaded", config };
}
