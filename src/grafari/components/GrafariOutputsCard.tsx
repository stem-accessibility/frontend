import React, { useRef, useState } from "react";
import { downloadJson } from "../services/downloadJson";
import { sonify } from "../services/sonify";
import ExportTactileButton from "./ExportTactileButton";
import type { ChartData } from "../services/computeSeries";
type Props = {
  datasetName: string;
  chartData: ChartData | null;     // keep flexible for now (matches your ChartRenderer input)
  vlSpec: unknown | null;      // the Vega-Lite spec built upstream (buildVegaLiteSpec)
};

const GrafariOutputsCard: React.FC<Props> = ({ datasetName, chartData, vlSpec }) => {
  const [speakLabels, setSpeakLabels] = useState(false);
  const sonifyHandleRef = useRef<{ stop: () => void } | null>(null);

  function onDownloadVegaLite() {
    if (!vlSpec) return;
    downloadJson(`${datasetName || "dataset"}_vegalite.json`, vlSpec);
  }

  function onPlaySonification() {
    if (!chartData) return;

    // stop prior playback
    sonifyHandleRef.current?.stop();

    sonifyHandleRef.current = sonify({
      chartData,
      speakLabels,
      tempoMs: 280,
      minHz: 220,
      maxHz: 880,
    });
  }

  function onStopSonification() {
    sonifyHandleRef.current?.stop();
    sonifyHandleRef.current = null;
  }

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
      <h2 style={{ marginTop: 0, fontSize: 18 }}>Outputs: Vega-Lite, Sonification, Tactile</h2>

      {!chartData ? (
        <div style={{ opacity: 0.7 }}>Upload data and choose a valid mapping to enable outputs.</div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button onClick={onDownloadVegaLite} type="button" disabled={!vlSpec}>
              Download Vega-Lite JSON
            </button>

            <button onClick={onPlaySonification} type="button" disabled={!chartData}>
              Play sonification
            </button>

            <button onClick={onStopSonification} type="button">
              Stop
            </button>

            <label style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={speakLabels}
                onChange={(e) => setSpeakLabels(e.target.checked)}
              />
              Speak labels
            </label>
          </div>

          <div style={{ marginTop: 12 }}>
            <ExportTactileButton
              apiBaseUrl={"http://localhost:5055"}
              spec={vlSpec}
              filename={`tactile-${datasetName || "grafari"}.svg`}
              disabled={!vlSpec}
            />
          </div>

          <details style={{ marginTop: 12 }}>
            <summary>Preview Vega-Lite JSON</summary>
            <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>
              {JSON.stringify(vlSpec, null, 2)}
            </pre>
          </details>
        </>
      )}
    </div>
  );
};

export default GrafariOutputsCard;
