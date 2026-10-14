import { describe, expect, it } from "vitest";
import {
  extractionPolicy,
  requestPlan,
  type ExtractionChoice,
  type ExtractionOptions,
} from "./chartExtractionPolicy";

const both: ExtractionOptions = { local: true, llm: true, mode: "unichart" };
const llmOnly: ExtractionOptions = { local: false, llm: true, mode: "llm" };
const localOnly: ExtractionOptions = { local: true, llm: false, mode: "unichart" };

function policy(
  over: Partial<{
    signedIn: boolean;
    options: ExtractionOptions | null;
    choice: ExtractionChoice;
    hasFile: boolean;
    busy: boolean;
  }> = {}
) {
  return extractionPolicy({
    signedIn: true,
    options: both,
    choice: "",
    hasFile: true,
    busy: false,
    ...over,
  });
}

describe("extractionPolicy", () => {
  it("never offers the AI model to a guest, whatever the server has configured", () => {
    const p = policy({ signedIn: false, options: both, choice: "ai" });
    expect(p.offerAi).toBe(false);
    expect(p.allowAi).toBe(false);
    expect(p.needsChoice).toBe(false);
    expect(p.canRead).toBe(true); // the built-in reader is still usable
  });

  it("gives a guest nothing when only the AI model exists", () => {
    const p = policy({ signedIn: false, options: llmOnly });
    expect(p.nothing).toBe(true);
    expect(p.canRead).toBe(false);
  });

  it("does not allow the AI model until it is explicitly chosen", () => {
    expect(policy({ choice: "" }).allowAi).toBe(false);
    expect(policy({ choice: "local" }).allowAi).toBe(false);
    expect(policy({ choice: "none" }).allowAi).toBe(false);
    expect(policy({ choice: "ai" }).allowAi).toBe(true);
  });

  it("blocks reading until a choice is made when the AI model is on offer", () => {
    const p = policy({ choice: "" });
    expect(p.needsChoice).toBe(true);
    expect(p.choiceMade).toBe(false);
    expect(p.canRead).toBe(false);
    expect(policy({ choice: "local" }).canRead).toBe(true);
    expect(policy({ choice: "ai" }).canRead).toBe(true);
  });

  it("treats declining the AI model as not a way to read", () => {
    const p = policy({ options: llmOnly, choice: "none" });
    expect(p.choiceMade).toBe(false);
    expect(p.canRead).toBe(false);
    expect(p.allowAi).toBe(false);
  });

  it("needs no choice when only the built-in reader exists", () => {
    const p = policy({ options: localOnly });
    expect(p.offerAi).toBe(false);
    expect(p.needsChoice).toBe(false);
    expect(p.canRead).toBe(true);
  });

  it("does not use the built-in reader when the server is in llm mode", () => {
    const p = policy({ options: { local: true, llm: true, mode: "llm" } });
    expect(p.useLocal).toBe(false);
  });

  it("needs a file and is not busy", () => {
    expect(policy({ choice: "local", hasFile: false }).canRead).toBe(false);
    expect(policy({ choice: "local", busy: true }).canRead).toBe(false);
  });

  it("offers nothing while the options are unknown", () => {
    const p = policy({ options: null, choice: "ai" });
    expect(p.nothing).toBe(true);
    expect(p.allowAi).toBe(false);
    expect(p.canRead).toBe(false);
  });
});

describe("requestPlan", () => {
  it("sends guests to the guest route without an allow_llm field", () => {
    expect(requestPlan(false, false)).toEqual({ endpoint: "/guest/extract-chart", allowLlmField: null });
    // Even if allowAi were somehow true, a guest request carries no consent field.
    expect(requestPlan(false, true).allowLlmField).toBeNull();
  });

  it("sends signed-in people to the job route with an explicit allow_llm", () => {
    expect(requestPlan(true, false)).toEqual({ endpoint: "/jobs/extract-chart", allowLlmField: "false" });
    expect(requestPlan(true, true)).toEqual({ endpoint: "/jobs/extract-chart", allowLlmField: "true" });
  });
});
