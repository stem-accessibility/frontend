import { describe, expect, it } from "vitest";
import { DIAGRAM_TYPES, normalizeDiagramType, supportsImageUpload } from "./diagramTypes";
import { normalizeSharing, SHARING_OPTIONS } from "../lib/sharing";

describe("image types", () => {
  it("falls back to flowchart for anything unknown or missing", () => {
    expect(normalizeDiagramType(undefined)).toBe("flowchart");
    expect(normalizeDiagramType("unknown")).toBe("flowchart");
    expect(normalizeDiagramType("BT")).toBe("bt");
  });

  it("allows image upload only for node-and-arrow types", () => {
    const allowed = DIAGRAM_TYPES.filter((t) => supportsImageUpload(t.value)).map((t) => t.value);
    expect(allowed.sort()).toEqual(["bt", "flowchart", "ll", "tree"]);
    expect(supportsImageUpload("arr")).toBe(false);
    expect(supportsImageUpload("2arr")).toBe(false);
  });
});

describe("sharing", () => {
  it("defaults to the most private setting for unknown values", () => {
    expect(normalizeSharing(undefined)).toBe("private");
    expect(normalizeSharing("everyone")).toBe("private");
    expect(normalizeSharing("link")).toBe("link");
  });

  it("offers exactly public, link, private, with plain-language labels", () => {
    expect(SHARING_OPTIONS.map((o) => o.value)).toEqual(["public", "link", "private"]);
    expect(SHARING_OPTIONS.map((o) => o.label)).toEqual(["Public", "Anyone with the link", "Only me"]);
  });
});
