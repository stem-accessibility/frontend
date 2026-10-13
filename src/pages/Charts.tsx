// src/pages/Charts.tsx
import React, { useState, useEffect, Suspense } from "react";
import { useLocation } from "react-router-dom";
import type { ParsedDataset, SonificationConfig, SonificationPresetId } from "../types/types";
import { CsvUploadPanel } from "../components/charts/CsvUploadPanel";
import { ColumnMappingPanel } from "../components/charts/ColumnMappingPanel";
import { SonificationPlayer } from "../components/charts/SonificationPlayer";
import { PermalinkBar } from "../components/charts/PermalinkBar";
import VisualChart from "../components/charts/VisualChart";
import ChartDataTable from "../components/charts/ChartDataTable";
import {
  SONIFICATION_PRESETS,
  getChartTypeForPreset,
} from "../sonification/sonificationPresets";
import './styles/Charts.css';
import { autoMapColumnsForPreset } from "../sonification/autoMap";
import { buildChartView } from "../services/chartView";
import { useAuth } from "../auth/AuthProvider";
import { apiFetch } from "../lib/api";
import type { LoadedSpec } from "../olli/vegaLiteSpec";
import { ChartSpecPanel } from "../components/charts/ChartSpecPanel";
import { ChartOptionsPanel } from "../components/charts/ChartOptionsPanel";
import { PRESET_COLUMN_REQUIREMENTS } from "../sonification/presets";

// Olli (and its styles) load only when a chart is shown, so they stay out of the main bundle.
const OlliView = React.lazy(() => import("../olli/OlliView"));
const DEFAULT_CONFIG: SonificationConfig = {
  timeColumn: "time",
  valueColumn: "value",
  preset: "line",
};

export default function Charts() {
  // /create passes the name the author chose; it becomes the chart's starting title.
  const location = useLocation();
  const stateTitle = (location.state as { title?: unknown } | null)?.title;
  const startingTitle = typeof stateTitle === "string" && stateTitle.trim() ? stateTitle.trim() : null;

  const [dataset, setDataset] = useState<ParsedDataset | null>(null);
  const [config, setConfig] = useState<SonificationConfig>({ ...DEFAULT_CONFIG, title: startingTitle });
  const { user } = useAuth();
  // The shared link for the chart as it was when the author pressed "Create permalink".
  const [permalinkUrl, setPermalinkUrl] = useState<string | null>(null);
  const [isSavingPermalink, setIsSavingPermalink] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A Vega-Lite specification the author uploaded; when set it describes the chart instead of the mapping.
  const [spec, setSpec] = useState<(LoadedSpec & { fileName: string }) | null>(null);
const [selectedPreset, setSelectedPreset] =
    useState<SonificationPresetId>("line");
   
  // A link describes the chart as it was saved, so editing anything makes the old one stale.
  useEffect(() => {
    setPermalinkUrl(null);
  }, [dataset, config, spec]);

  useEffect(() => {
  console.log("[Charts] Mounted");
}, []);

  const handleDatasetLoaded = (data: ParsedDataset) => {
    setDataset(data);
    setError(null);
    setSpec(null); // a specification was applied to the previous data
    // Map columns for the current preset; the defaults name columns the file may not have.
    // Titles and labels described the previous data, so they are cleared too.
    setConfig((prev) => ({
      ...prev,
      ...autoMapColumnsForPreset(data, prev.preset),
      title: startingTitle,
      xLabel: null,
      yLabel: null,
      categoryOrder: "data",
    }));
  };

  const handleSpecLoaded = (loaded: LoadedSpec, fileName: string) => {
    setSpec({ ...loaded, fileName });
    setError(null);
    // A specification that carries its own data replaces the table and sonification data.
    if (loaded.dataset && !loaded.usedUploadedData) {
      const data = loaded.dataset;
      setDataset(data);
      setConfig((prev) => ({
        ...prev,
        ...autoMapColumnsForPreset(data, prev.preset),
        title: startingTitle,
        xLabel: null,
        yLabel: null,
        categoryOrder: "data",
      }));
    }
  };

  const handleConfigChange = (next: SonificationConfig) => {
    setConfig(next);
  };

  const handlePermalinkCreate = async () => {
    if (!user) {
      setError("Sign in to save a link to this chart.");
      return;
    }
    if (!dataset || !config.valueColumn) {
      setError("Upload a CSV and choose a value column before creating a permalink.");
      return;
    }

    try {
      setIsSavingPermalink(true);
      setError(null);

      const saved = await apiFetch<{ public_url: string | null }>("/charts", {
        method: "POST",
        json: {
          dataset,
          config,
          // The uploaded specification travels with the link so a visitor gets the same description.
          ...(spec ? { spec: spec.source } : {}),
          // Name it after the author's own title, else the specification's, else the file's.
          title: chartTitle || spec?.title || undefined,
          sharing: "link",
        },
      });
      if (!saved.public_url) throw new Error("The chart was saved but no link was returned.");
      setPermalinkUrl(`${window.location.origin}${saved.public_url}`);
    } catch (e) {
      // apiFetch errors look like "400 BAD REQUEST: <server message>"; show only the message.
      const raw = e instanceof Error ? e.message : "";
      setError(raw.replace(/^\d{3}[^:]*:\s*/, "") || "Something went wrong creating the permalink.");
    } finally {
      setIsSavingPermalink(false);
    }
  };

  const view = React.useMemo(
    () => (dataset ? buildChartView(dataset, config) : null),
    [dataset, config]
  );

  const req = PRESET_COLUMN_REQUIREMENTS[config.preset];
  const categoryField = view?.categoryField ?? null;
  const chartRows = view?.chartRows ?? [];
  const chartTitle = view?.title;
  const xLabel = view?.xLabel;
  const yLabel = view?.yLabel;
  // An uploaded specification describes the chart instead of the column mapping.
  const olliSpec = spec ? spec.olli : (view?.olliSpec ?? null);

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

          <ChartSpecPanel
            dataset={dataset}
            activeName={spec?.fileName ?? null}
            onLoaded={handleSpecLoaded}
            onCleared={() => setSpec(null)}
          />

          {dataset && (
            <ColumnMappingPanel
              dataset={dataset}
              config={config}
              onChange={handleConfigChange}
            />
          )}

          {dataset && !spec && (
            <ChartOptionsPanel
              config={config}
              onChange={handleConfigChange}
              showCategoryOrder={req.needsCategory}
              xDefault={categoryField && dataset.columns.includes(categoryField) ? categoryField : "Row"}
              yDefault={config.valueColumn ?? "Value"}
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
          {spec && (
            <section className="card" aria-labelledby="visual-chart-spec-heading">
              <h2 id="visual-chart-spec-heading">Visual chart</h2>
              <p className="hint">
                The chart is described from <strong>{spec.fileName}</strong>. A drawing of an uploaded
                specification is not shown here; use the data table and navigable chart below.
              </p>
            </section>
          )}
          {!spec && dataset && config.valueColumn && (
        <section className="card">
            <div className="charts-card-header">
          <h2>Visual chart</h2>
          
    </div>
    

          <VisualChart
            rows={chartRows}
            xField={config.categoryColumn || config.timeColumn || "__index"}
            yField={config.valueColumn} // now guaranteed non-null
            chartType={getChartTypeForPreset(config.preset)}
            title={chartTitle}
            xLabel={xLabel}
            yLabel={yLabel}
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
                caption={
                  chartTitle
                    ? `Data for ${chartTitle}`
                    : dataset.name
                      ? `Data from ${dataset.name}`
                      : "Chart data"
                }
              />
            </section>
          )}

          {olliSpec && (
            <section className="card" aria-labelledby="navigable-chart-heading">
              <div className="charts-card-header">
                <h2 id="navigable-chart-heading">Navigable chart</h2>
              </div>
              {spec && (
                <p className="hint">
                  Described from the uploaded specification <strong>{spec.fileName}</strong>.
                </p>
              )}
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
            disabled={!dataset || !config.valueColumn || !user}
            note={
              !user ? (
                <p>
                  Sign in to save a link.{" "}
                  {/* A new tab, so the data and settings on this page are not lost. */}
                  <a href="/login?next=%2Fcharts" target="_blank" rel="noopener noreferrer">
                    Sign in<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                  , then come back here and create the link.
                </p>
              ) : undefined
            }
          />
        </div>
      </section>
    </main>
  );
}
