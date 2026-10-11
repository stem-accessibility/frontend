import React, { useMemo, useState } from "react";

import { parseCsv, type Row } from "../services/parseCsv";
import { profileDataset, type DatasetProfile, type Field } from "../services/profileDataset";
import { buildVizIR } from "../services/buildVizIR";
import type { ChartType, Intent, VizIR } from "../types/vizIR";
import { computeSeries } from "../services/computeSeries";
import ChartRenderer from "../components/ChartRenderer";
import GrafariOutputsCard from "../components/GrafariOutputsCard";
import { buildVegaLiteSpec } from "../services/buildVegaLiteSpec";
// import ExportTactileButton from "../components/ExportTactileButton";

import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";
import type { VisualizationRecord } from "../types/visualizationRecord";
import { saveVisualizationRecord } from "../services/visualizationStore";




const INTENTS: { value: Intent; label: string; help: string }[] = [
  { value: "compare_categories", label: "Compare categories", help: "Compare values across categories (bar)." },
  { value: "trend_over_time", label: "Trend over time", help: "Show change over time (line)." },
  // Keep extra intents disabled until you implement them
  { value: "rank", label: "Rank (later)", help: "Top-K ranking view." },
  { value: "distribution", label: "Distribution (later)", help: "Histogram/box plot view." },
  { value: "relationship", label: "Relationship (later)", help: "Scatter / correlation view." },
];

function downloadJson(filename: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function isNumericField(fields: Field[], fieldName?: string) {
  if (!fieldName) return false;
  const f = fields.find((x) => x.name === fieldName);
  return f?.dataType === "number";
}

function isDateField(fields: Field[], fieldName?: string) {
  if (!fieldName) return false;
  const f = fields.find((x) => x.name === fieldName);
  return f?.dataType === "date";
}

const GrafariPlaygroundPage: React.FC = () => {
  const navigate = useNavigate();

  // Data
  const [fileName, setFileName] = useState<string>("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [profile, setProfile] = useState<DatasetProfile | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Spec controls
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [intent, setIntent] = useState<Intent>("compare_categories");
  const [xField, setXField] = useState<string>("");
  const [yField, setYField] = useState<string>("");
  const [aggregate, setAggregate] = useState<"sum" | "avg" | "count" | "none">("sum");

  // IR
  const [ir, setIr] = useState<VizIR | null>(null);

 // const [lastTactileSvg, setLastTactileSvg] = useState<string | null>(null);


  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      setIr(null);

      setFileName(file.name);

      const parsedRows = await parseCsv(file);
      if (!parsedRows || parsedRows.length === 0) {
        setRows(null);
        setProfile(null);
        setFields([]);
        setError("No rows parsed. Check that your CSV has a header row and at least one data row.");
        return;
      }

      const p = profileDataset(parsedRows);
      setRows(parsedRows);
      setProfile(p);
      setFields(p.fields);

      // Reasonable defaults:
      // - choose date field for x if line / trend
      // - choose first string for x otherwise
      // - choose first numeric for y
      const firstNumeric = p.fields.find((f) => f.dataType === "number")?.name ?? "";
      const firstString = p.fields.find((f) => f.dataType === "string")?.name ?? "";
      const firstDate = p.fields.find((f) => f.dataType === "date")?.name ?? "";

      if (!yField) setYField(firstNumeric);

      // pick x based on intent/chart
      if (!xField) {
        if (chartType === "line" || intent === "trend_over_time") setXField(firstDate || firstString);
        else setXField(firstString || firstDate);
      }
    } catch (err: any) {
      setRows(null);
      setProfile(null);
      setFields([]);
      setIr(null);
      setError(
        typeof err === "string"
          ? err
          : err?.message
          ? err.message
          : "Failed to parse CSV."
      );
    }
  }

  // Keep intent & chartType coherent (MVP supports bar + compare, line + trend)
  function onChangeChartType(next: ChartType) {
    setChartType(next);
    // sync intent
    if (next === "bar" && intent === "trend_over_time") setIntent("compare_categories");
    if (next === "line" && intent === "compare_categories") setIntent("trend_over_time");
  }

  function onChangeIntent(next: Intent) {
    // block unsupported intents in MVP (you can relax later)
    if (next === "rank" || next === "distribution" || next === "relationship") return;

    setIntent(next);
    if (next === "compare_categories") setChartType("bar");
    if (next === "trend_over_time") setChartType("line");
  }
  
  const mappingValid = useMemo(() => {
    if (!rows || !profile) return false;
    if (!xField || !yField) return false;
    if (xField === yField) return false;

    // bar: y must be numeric
    if (chartType === "bar") return isNumericField(fields, yField);

    // line: x must be date (preferable) and y numeric
    if (chartType === "line") return isDateField(fields, xField) && isNumericField(fields, yField);

    return false;
  }, [rows, profile, chartType, xField, yField, fields]);

  const chartData = useMemo(() => {
  if (!rows) return null;
  if (!mappingValid) return null;

  return computeSeries({
    rows,
    chartType,
    xField,
    yField,
    aggregate,
  });
}, [rows, mappingValid, chartType, xField, yField, aggregate]);


const vlSpec = useMemo(() => {
  if (!rows) return null;
  if (!mappingValid) return null;

  return buildVegaLiteSpec({
    chartType,
    rows,
    xField,
    yField,
    aggregate,
  });
}, [rows, mappingValid, chartType, xField, yField, aggregate]);

  function buildIrNow() {
  if (!rows || !profile) return;
  if (!mappingValid || !vlSpec) {
    setIr(null);
    setError("Mapping is invalid for the selected chart type (check X/Y types).");
    return;
  }

  setError(null);

  const built = buildVizIR({
    datasetName: fileName || "dataset",
    rows,
    chartType,
    intent,
    mapping: { xField, yField, aggregate },
  });
  setIr(built);

  // Create immutable record ID
  const id = uuidv4();
  const now = new Date().toISOString();

  const record: VisualizationRecord = {
    id,
    createdAt: now,
    updatedAt: now,
    datasetName: fileName || "dataset",
    rowCount: rows.length,
    chartType,
    intent,
    mapping: { xField, yField, aggregate },
    rows,
    vegaLiteSpec: vlSpec,
    vizIR: built,
    sonification: { enabled: true },
  };

  saveVisualizationRecord(record);

  // Navigate to immutable permalink
  navigate(`/viz/${id}`);
}


  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>Grafari Playground</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Upload a CSV, map fields, generate an accessible-first visualization IR, and export it.
      </p>

      {/* Top controls */}
      <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 16, marginTop: 16 }}>
        {/* Left: Controls */}
        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
          <h2 style={{ marginTop: 0, fontSize: 18 }}>1) Upload data</h2>

          <input type="file" accept=".csv,text/csv" onChange={onFileChange} />

          {fileName && (
            <div style={{ marginTop: 8, opacity: 0.8 }}>
              Loaded: <strong>{fileName}</strong>
            </div>
          )}

          {profile && (
            <div style={{ marginTop: 8, opacity: 0.8 }}>
              Rows: <strong>{profile.rowCount}</strong>
            </div>
          )}

          <hr style={{ margin: "16px 0", border: "none", borderTop: "1px solid #eee" }} />

          <h2 style={{ marginTop: 0, fontSize: 18 }}>2) Choose intent + chart</h2>

          <div style={{ display: "grid", gap: 8 }}>
            <label>
              Intent
              <select
                value={intent}
                onChange={(e) => onChangeIntent(e.target.value as Intent)}
                style={{ width: "100%", marginTop: 4 }}
              >
                {INTENTS.map((i) => (
                  <option
                    key={i.value}
                    value={i.value}
                    disabled={i.value === "rank" || i.value === "distribution" || i.value === "relationship"}
                  >
                    {i.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Chart type
              <select
                value={chartType}
                onChange={(e) => onChangeChartType(e.target.value as ChartType)}
                style={{ width: "100%", marginTop: 4 }}
              >
                <option value="bar">Bar</option>
                <option value="line">Line</option>
              </select>
            </label>
          </div>

          <hr style={{ margin: "16px 0", border: "none", borderTop: "1px solid #eee" }} />

          <h2 style={{ marginTop: 0, fontSize: 18 }}>3) Map fields</h2>

          {!profile ? (
            <div style={{ opacity: 0.7 }}>Upload a CSV to map fields.</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              <label>
                X field
                <select
                  value={xField}
                  onChange={(e) => setXField(e.target.value)}
                  style={{ width: "100%", marginTop: 4 }}
                >
                  <option value="">Select field…</option>
                  {fields.map((f) => (
                    <option key={f.id} value={f.name}>
                      {f.name} ({f.dataType})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Y field
                <select
                  value={yField}
                  onChange={(e) => setYField(e.target.value)}
                  style={{ width: "100%", marginTop: 4 }}
                >
                  <option value="">Select field…</option>
                  {fields.map((f) => (
                    <option key={f.id} value={f.name}>
                      {f.name} ({f.dataType})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Aggregate
                <select
                  value={aggregate}
                  onChange={(e) => setAggregate(e.target.value as any)}
                  style={{ width: "100%", marginTop: 4 }}
                >
                  <option value="sum">sum</option>
                  <option value="avg">avg</option>
                  <option value="count">count</option>
                  <option value="none">none</option>
                </select>
              </label>

              <button onClick={buildIrNow} disabled={!mappingValid}>
                Generate IR
              </button>

              {!mappingValid && rows && (
                <div style={{ color: "#8a5a00", fontSize: 13, lineHeight: 1.4 }}>
                  Mapping not valid for this chart type.
                  <ul style={{ margin: "6px 0 0 18px" }}>
                    {chartType === "bar" && <li>Bar: Y must be a number.</li>}
                    {chartType === "line" && <li>Line: X must be a date and Y must be a number.</li>}
                    <li>X and Y must be different fields.</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {error && <div style={{ marginTop: 12, color: "crimson" }}>{error}</div>}

          {ir && (
            <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => downloadJson("grafari-ir.json", ir)}>Download IR JSON</button>
            </div>
          )}
        </div>

        {/* Right: Outputs */}
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
            <h2 style={{ marginTop: 0, fontSize: 18 }}>Detected fields</h2>
            {!profile ? (
              <div style={{ opacity: 0.7 }}>Upload a CSV to see inferred schema.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", borderBottom: "1px solid #eee", padding: 6 }}>Field</th>
                    <th style={{ textAlign: "left", borderBottom: "1px solid #eee", padding: 6 }}>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((f) => (
                    <tr key={f.id}>
                      <td style={{ padding: 6, borderBottom: "1px solid #f3f3f3" }}>{f.name}</td>
                      <td style={{ padding: 6, borderBottom: "1px solid #f3f3f3" }}>{f.dataType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 10 }}>
            <h2 style={{ margin: 10, fontSize: 18 }}>Chart preview</h2>

            {!chartData ? (
                <div style={{ opacity: 0.7 }}>
                Upload data and choose a valid mapping to preview the chart.
                </div>
            ) : (
                <ChartRenderer
                title={ir?.narrative.title ?? "Grafari chart"}
                data={chartData}
                />
            )}
            </div>
            

            {/* Outputs: Vega-Lite + Sonification + Tactile */}
             <GrafariOutputsCard
                datasetName={fileName || "grafari-playground"}
                chartData={chartData}
                vlSpec={vlSpec}
              />



          <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
            <h2 style={{ marginTop: 0, fontSize: 18 }}>IR preview</h2>
            {!ir ? (
              <div style={{ opacity: 0.7 }}>
                Generate the IR to see the semantic model and accessibility structure.
              </div>
            ) : (
              <pre
                style={{
                  margin: 0,
                  maxHeight: 380,
                  overflow: "auto",
                  background: "#fafafa",
                  border: "1px solid #eee",
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 12,
                }}
              >
                {JSON.stringify(ir, null, 2)}
              </pre>
            )}
          </div>

          <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
            <h2 style={{ marginTop: 0, fontSize: 18 }}>Accessibility quick view</h2>
            {!ir ? (
              <div style={{ opacity: 0.7 }}>Generate IR to populate summary + keyboard order.</div>
            ) : (
              <>
                <div style={{ marginBottom: 10 }}>
                  <strong>Summary</strong>
                  <div style={{ marginTop: 6, opacity: 0.9 }}>
                    {ir.narrative.shortSummary}
                  </div>
                </div>

                <div>
                  <strong>Keyboard order (MVP)</strong>
                  <ol style={{ marginTop: 8 }}>
                    {ir.accessibility.keyboard.order.map((nodeId) => (
                      <li key={nodeId}>
                        <code>{nodeId}</code>{" "}
                        <span style={{ opacity: 0.85 }}>
                          — {ir.accessibility.tree[nodeId]?.label}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrafariPlaygroundPage;
