// src/sonification/erieClient.ts
// erieClient.ts
// src/sonification/erieClient.ts
import * as Erie from "erie-web";
import type { ParsedDataset, SonificationConfig } from "../types/types";

// Helper: sanitize rows for Erie
function buildCleanRows(
  dataset: ParsedDataset,
  valueField: string,
  timeField?: string | null
) {
  return dataset.rows
    // 1) Drop completely empty rows (Papaparse often gives one at the end)
    .filter((row) => {
      const vals = Object.values(row ?? {});
      return vals.some(
        (v) =>
          v !== null &&
          v !== undefined &&
          String(v).trim() !== ""
      );
    })
    // 2) Map to numeric values + synthetic index
    .map((row, index) => {
      const rawValue = (row as any)[valueField];
      const numericValue = typeof rawValue === "number" ? rawValue : Number(rawValue);

      let numericTime: number;
      if (timeField) {
        const rawTime = (row as any)[timeField];
        numericTime = typeof rawTime === "number" ? rawTime : Number(rawTime);
      } else {
        // If no time column selected, just use the row index as time
        numericTime = index;
      }

      return {
        ...row,
        __index: index, // keep index around just in case
        [valueField]: numericValue,
        __time: numericTime,
      };
    })
    // 3) Filter out any rows with non-finite numbers
    .filter((row) => {
      const v = (row as any)[valueField];
      const t = (row as any).__time;
      return Number.isFinite(v) && Number.isFinite(t);
    });
}
// Build a single-stream JSON spec in the shape Erie expects
// https://see-mike-out.github.io/erie-documentation/docs/stream/stream.html
export function buildErieSpecFromConfig(
  dataset: ParsedDataset,
  config: SonificationConfig
) {
  const { name } = dataset;
 const valueField = config.valueColumn ?? "value";
// No time column means "use row order"; buildCleanRows then fills __time from the row index.
const timeField = config.timeColumn || null;


  if (!valueField) {
    throw new Error("Missing valueColumn for sonification.");
  }

  const cleanRows = buildCleanRows(dataset, valueField, timeField);
console.log("[CleanRows]", cleanRows);

  if (!cleanRows.length) {
    throw new Error("No valid numeric rows found for sonification.");
  }

  // 2) Compute value domain [min, max] for pitch scaling
  const values = cleanRows.map((r) => (r as any)[valueField] as number);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);

  // Avoid zero-width domain
  const pad = maxVal - minVal || 1;
  const domain: [number, number] = [minVal - 0.05 * pad, maxVal + 0.05 * pad];


  const spec = {
    // Top-level stream spec (single sonification)
    title: name ?? "Uploaded dataset",
    description:
      timeField && timeField !== valueField
        ? `Column "${valueField}" is mapped to pitch. Column "${timeField}" is mapped to time.`
        : `Column "${valueField}" is mapped to pitch, and row order is mapped to time.`,

    // Data: we pass tidy rows directly
    // https://see-mike-out.github.io/erie-documentation/docs/data/data.html
    data: {
      values: cleanRows,
    },

    // Very simple tone, discrete notes
    tone: {
      type: "default",    // built-in tone
      continued: false,   // discrete tones, not continuous
    },

    // Encoding: time + pitch (+ constant loudness)
    // https://see-mike-out.github.io/erie-documentation/docs/encoding/encoding.html
    encoding: {
      time: {
        field: timeField ?? "__time",
        type: "quantitative",
        scale: {
          length: 5,      // total sonification length in seconds
        },
      },
      pitch: {
        field: valueField,
        type: "quantitative",
        scale: {
          domain,            // [min, max] of your "value" column
          range: [220, 880], // Hz: roughly A3 → A5
          polarity: "positive",
        },
      },
      loudness: {
        value: 0.8,
      },
    },

    config: {},
  };

  console.log("[Erie] Spec built:", spec);
  return spec;
}

// Compile & play using Erie’s compiler + player APIs
// https://see-mike-out.github.io/erie-documentation/docs/how-to-use/compiler-api.html
// https://see-mike-out.github.io/erie-documentation/docs/how-to-use/player.html
export async function playSonificationWithErie(
  dataset: ParsedDataset,
  config: SonificationConfig
): Promise<void> {
     console.log("[ErieClient] Building spec with", { dataset, config });
  const spec = buildErieSpecFromConfig(dataset, config);

  console.log("[ErieClient] Building audio graph via compileAudioGraph...");
  const sequence: any = await (Erie as any).compileAudioGraph(spec);
  console.log("[ErieClient] SequenceStream:", sequence);

  // ✅ SequenceStream has its own play method (often named playQueue)
  if (typeof sequence.playQueue === "function") {
    console.log("[ErieClient] Calling sequence.playQueue()…");
    sequence.playQueue();
  } else if (typeof sequence.play === "function") {
    console.log("[ErieClient] sequence.playQueue() missing, falling back to sequence.play()…");
    sequence.play();
  } else {
    console.error("[ErieClient] No play/playQueue method found on SequenceStream", sequence);
    throw new Error("Erie SequenceStream has no play method.");
  }
}