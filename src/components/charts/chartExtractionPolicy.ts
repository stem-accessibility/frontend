// The rules for reading a chart image, kept apart from the React panel so they can be tested.
// The server enforces the same rules (guests never reach the AI model; the AI model is used only
// when `allow_llm` is true); this decides what the interface offers and what it sends.

export type ExtractionOptions = { local: boolean; llm: boolean; mode: string };
export type ExtractionChoice = "" | "local" | "ai" | "none";

export interface PolicyInput {
  signedIn: boolean;
  /** What /chart-extraction/options reported; null while loading or when it could not be read. */
  options: ExtractionOptions | null;
  choice: ExtractionChoice;
  hasFile: boolean;
  busy: boolean;
}

export interface Policy {
  /** The built-in reader can be used. */
  useLocal: boolean;
  /** The AI model is on offer (signed in, and the server has one configured). */
  offerAi: boolean;
  /** Nothing can read a chart for this person right now. */
  nothing: boolean;
  /** The person must choose before reading (only when the AI model is on offer). */
  needsChoice: boolean;
  choiceMade: boolean;
  /** The image may be sent to the AI model. True only after an explicit "ai" choice. */
  allowAi: boolean;
  canRead: boolean;
}

export function extractionPolicy({ signedIn, options, choice, hasFile, busy }: PolicyInput): Policy {
  const useLocal = !!options && options.local && options.mode !== "llm";
  const offerAi = signedIn && !!options && options.llm;
  const nothing = !options || (!useLocal && !offerAi);
  const needsChoice = offerAi;
  const choiceMade = !needsChoice || choice === "local" || choice === "ai";
  const allowAi = offerAi && choice === "ai";
  const canRead = hasFile && choiceMade && !busy && !nothing;
  return { useLocal, offerAi, nothing, needsChoice, choiceMade, allowAi, canRead };
}

export interface RequestPlan {
  endpoint: string;
  /** Value for the `allow_llm` form field, or null when the field is not sent (guests). */
  allowLlmField: "true" | "false" | null;
}

/** Guests use the guest route and never send `allow_llm`; signed-in people always send it. */
export function requestPlan(signedIn: boolean, allowAi: boolean): RequestPlan {
  return signedIn
    ? { endpoint: "/jobs/extract-chart", allowLlmField: allowAi ? "true" : "false" }
    : { endpoint: "/guest/extract-chart", allowLlmField: null };
}
