/** Clear the editor's remembered "latest" STEM image so a new one starts clean. */
export function clearLatestDiagramCache() {
  for (const key of [
    "latestDiagramJSON",
    "latestMermaidCode",
    "latestDiagramImage",
    "latestSummary",
    "latestDiagramImageMime",
    "latestTitle",
    "latestShortAlt",
    "editorMode",
    "activeFlowchartId",
    "pendingType",
    "pendingSharing",
    "pendingImagePublic",
    "pendingMarkdown",
  ]) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* storage can be unavailable; the editor then just starts from its defaults */
    }
  }
}
