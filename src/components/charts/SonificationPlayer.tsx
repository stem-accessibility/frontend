// src/components/charts/SonificationPlayer.tsx
import { useState } from "react";
import type { ParsedDataset, SonificationConfig } from "../../types/types";
import { playSonificationWithErie } from "../../sonification/erieClient";

interface Props {
  dataset: ParsedDataset | null;
  config: SonificationConfig;
  disabled?: boolean;
}

export function SonificationPlayer({ dataset, config, disabled }: Props) {
   console.log("[SonificationPlayer] Render", { dataset, config, disabled });
    const [status, setStatus] = useState<"idle" | "playing" | "error">("idle");
    
    const [_message, setMessage] = useState<string | null>(null);


  const handlePlay = async () => {
    console.log("[SonificationPlayer] handlePlay called");

    if (!dataset || !config.valueColumn) {
      console.log("[SonificationPlayer] Missing dataset or valueColumn", {
        dataset,
        config,
      });
      setMessage("Upload a CSV and choose a value column first.");
      return;
    }
    try {
      setStatus("playing");
      setMessage(null);
      console.log("[SonificationPlayer] About to play with Erie…");
      await playSonificationWithErie(dataset, config);
      // await playWithErie(dataset, config);
      // e.g. call your useErieSonification hook or a util function
      setStatus("idle");
    } catch (e) {
      console.error("[SonificationPlayer] Error:", e);
      setStatus("error");
    }
  };

  return (
    <section className="card">
      <h2>Sonification</h2>
      <button onClick={handlePlay} disabled={disabled || status === "playing"}>
        {status === "playing" ? "Playing…" : "Play sonification"}
      </button>
      <p className="hint">
        {status === "error"
          ? "Something went wrong while playing audio."
          : "Audio is generated client-side using Erie."}
      </p>
    </section>
  );
}
