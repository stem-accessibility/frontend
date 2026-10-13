// A shared chart, opened from a link (/charts/:slug). Read-only: the same table, outline, visual
// chart and sound as the Charts page, built from the saved data and settings.
import React, { Suspense, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { OlliVisSpec } from "olli";
import type { ParsedDataset, SonificationConfig } from "../types/types";
import { publicFetch } from "../lib/api";
import { buildChartView } from "../services/chartView";
import { getChartTypeForPreset } from "../sonification/sonificationPresets";
import VisualChart from "../components/charts/VisualChart";
import ChartDataTable from "../components/charts/ChartDataTable";
import { SonificationPlayer } from "../components/charts/SonificationPlayer";
import PageLoading from "../components/PageLoading";
import "./styles/Charts.css";

// Loaded on demand, like on the Charts page.
const OlliView = React.lazy(() => import("../olli/OlliView"));

type SharedChart = {
  title: string | null;
  dataset: ParsedDataset;
  config: SonificationConfig;
  spec: Record<string, unknown> | null;
};

export default function ChartPermalinkPage() {
  const { slug } = useParams<{ slug: string }>();
  const [chart, setChart] = useState<SharedChart | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  // The outline from the author's specification, when they saved one.
  const [specOlli, setSpecOlli] = useState<OlliVisSpec | null>(null);
  const [specProblem, setSpecProblem] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setMissing(false);
    setChart(null);
    setSpecOlli(null);
    setSpecProblem(null);
    publicFetch<SharedChart>(`/c/${encodeURIComponent(slug ?? "")}`)
      .then((c) => !cancelled && setChart(c))
      .catch(() => !cancelled && setMissing(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!chart?.spec) return;
    let cancelled = false;
    (async () => {
      // Same loader as the upload: it applies the saved table to a specification with no data of its own.
      const { loadVegaLiteSpec } = await import("../olli/vegaLiteSpec");
      const res = await loadVegaLiteSpec(JSON.stringify(chart.spec), chart.title ?? "Chart", chart.dataset);
      if (cancelled) return;
      if ("error" in res) setSpecProblem(res.error);
      else setSpecOlli(res.olli);
    })().catch(() => !cancelled && setSpecProblem("The saved specification could not be read."));
    return () => {
      cancelled = true;
    };
  }, [chart]);

  const view = useMemo(() => (chart ? buildChartView(chart.dataset, chart.config) : null), [chart]);

  if (loading) return <PageLoading />;

  if (missing || !chart || !view) {
    return (
      <main className="charts-page">
        <h1>Chart not found</h1>
        <p>
          This link is not available. The chart may have been removed, or its owner may have stopped
          sharing it.
        </p>
        <p>
          <Link to="/charts">Make your own chart</Link>
        </p>
      </main>
    );
  }

  const { config, dataset } = chart;
  const heading = view.title || chart.title || dataset.name || "Shared chart";
  // A saved specification replaces the column mapping unless it could not be read.
  const olliSpec = specOlli ?? view.olliSpec;
  const hasSpec = !!chart.spec && !specProblem;

  return (
    <main className="charts-page">
      <div className="charts-header">
        <h1>{heading}</h1>
        <p>
          A shared chart. <Link to="/charts">Make your own chart</Link>
        </p>
      </div>

      <section className="charts-layout">
        <div className="charts-right">
          {specProblem && (
            <p role="alert" className="error-banner">
              The author's specification could not be used ({specProblem}). Showing the chart from the
              saved columns instead.
            </p>
          )}

          {!hasSpec && config.valueColumn && (
            <section className="card" aria-labelledby="shared-visual-heading">
              <h2 id="shared-visual-heading">Visual chart</h2>
              <VisualChart
                rows={view.chartRows}
                xField={view.categoryField || "__index"}
                yField={config.valueColumn}
                chartType={getChartTypeForPreset(config.preset)}
                title={view.title}
                xLabel={view.xLabel}
                yLabel={view.yLabel}
              />
            </section>
          )}

          <section className="card" aria-labelledby="shared-table-heading">
            <h2 id="shared-table-heading">Data table</h2>
            <ChartDataTable
              dataset={dataset}
              caption={view.title ? `Data for ${view.title}` : dataset.name ? `Data from ${dataset.name}` : "Chart data"}
            />
          </section>

          {olliSpec && (
            <section className="card" aria-labelledby="shared-nav-heading">
              <h2 id="shared-nav-heading">Navigable chart</h2>
              {hasSpec && (
                <p className="hint">Described from the specification the author saved with this chart.</p>
              )}
              <p className="hint">
                Explore the chart as a structured outline. Use the arrow keys to move: Up and Down change
                level, Left and Right move between items. Press ? for all keys and t to open the data as a
                table.
              </p>
              <Suspense fallback={<p role="status">Loading navigable chart…</p>}>
                <OlliView spec={olliSpec} label="Navigable chart" />
              </Suspense>
            </section>
          )}

          <SonificationPlayer dataset={dataset} config={config} disabled={!config.valueColumn} />
        </div>
      </section>
    </main>
  );
}
