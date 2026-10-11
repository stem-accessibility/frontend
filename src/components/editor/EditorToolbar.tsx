import { useEffect, useState } from "react";
import { DIAGRAM_TYPES } from "../../arboretum/diagramTypes";
import type { DiagramType } from "../../arboretum/diagramTypes";
export type EditorMode = "visual" | "mermaid";
type Props = {
  hasImage: boolean;
  onViewImage: () => void;
  onReupload: () => void;
  onStartOver: () => void;

  onOpenAltText: () => void;
  hasAltText: boolean;

  diagramType: DiagramType;
  onDiagramTypeChange: (type: DiagramType) => void;

  onSave: () => void;
  isSaving: boolean;
  disableSave?: boolean;

  onExport: () => void;

  flowchartId: string | null;
  isPublished: boolean;

 
  isDirty: boolean;
  editorMode: EditorMode;
  onEditorModeChange: (mode: EditorMode) => void;
};

export default function EditorToolbar({
  hasImage,
  onViewImage,
  onStartOver,
  onOpenAltText,
  hasAltText,
  diagramType,
  onDiagramTypeChange,
  onSave,
  isSaving,
  disableSave,
  onExport,
  flowchartId,
  isPublished,
  isDirty,
  editorMode,
  onEditorModeChange,
}: Props) {
  // purely for small “Saved” feedback after save completes
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    // When we become clean (dirty -> false), show a short "Saved" state.
    if (!isDirty && flowchartId) {
      setJustSaved(true);
      const t = window.setTimeout(() => setJustSaved(false), 1200);
      return () => window.clearTimeout(t);
    }
    // If user edits again, remove "Saved" state immediately
    if (isDirty) setJustSaved(false);
  }, [isDirty, flowchartId]);

  const saveLabel = isSaving
    ? "Saving…"
    : justSaved
      ? "Saved"
      : isDirty
        ? "Save changes"
        : "Save";

  // Optional: nudge users to save before export/publish
  const exportLabel = isDirty ? "Export (save first)" : "Export";

  return (
    <div className="canvas-toolbar" role="region" aria-label="Canvas actions">
      <div className="canvas-toolbar__group">
        <button
          type="button"
          className="canvas-toolbar__btn"
          onClick={onViewImage}
          disabled={!hasImage}
          aria-disabled={!hasImage}
        >
          View uploaded image
        </button>

        <button type="button" className="canvas-toolbar__btn" onClick={onStartOver}>
          Create a New Diagram
        </button>

        <button
          type="button"
          className="canvas-toolbar__btn"
          onClick={onOpenAltText}
          aria-haspopup="dialog"
        >
          {hasAltText ? "Alt text" : "Alt text (missing)"}
        </button>

        <label className="canvas-toolbar__type">
          <span>Image type</span>
          <select
            value={diagramType}
            onChange={(e) => onDiagramTypeChange(e.target.value as DiagramType)}
            aria-describedby="diagram-type-hint"
          >
            {DIAGRAM_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <span id="diagram-type-hint" className="sr-only">
          {DIAGRAM_TYPES.find((t) => t.value === diagramType)?.hint}
        </span>
      </div>

      <div className="canvas-toolbar__group" aria-label="Editor mode">
        <div className="editor-mode-toggle" role="tablist" aria-label="Editor mode">
          <button
            type="button"
            role="tab"
            aria-selected={editorMode === "visual"}
            className={
              editorMode === "visual"
                ? "canvas-toolbar__btn mode-tab mode-tab--active"
                : "canvas-toolbar__btn mode-tab"
            }
            onClick={() => onEditorModeChange("visual")}
          >
            Visual
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={editorMode === "mermaid"}
            className={
              editorMode === "mermaid"
                ? "canvas-toolbar__btn mode-tab mode-tab--active"
                : "canvas-toolbar__btn mode-tab"
            }
            onClick={() => onEditorModeChange("mermaid")}
          >
            Mermaid
          </button>
        </div>
      </div>

      <div className="canvas-toolbar__spacer" />

      <div
        className="canvas-toolbar__group"
        style={{ display: "flex", gap: 10, alignItems: "center" }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {isPublished ? (
            <span className="status-chip status-chip--published">Published</span>
          ) : (
            <span className="status-chip status-chip--draft">Draft</span>
          )}

          {isDirty ? <span className="status-chip status-chip--warn">Unsaved changes</span> : null}
        </div>

        <button
          type="button"
          className={
            isDirty
              ? "canvas-toolbar__btn canvas-toolbar__btn--primary canvas-toolbar__btn--dirty"
              : "canvas-toolbar__btn canvas-toolbar__btn--primary"
          }
          onClick={onSave}
          disabled={!!disableSave || isSaving}
        >
          {saveLabel}
        </button>

        <button
          type="button"
          className="canvas-toolbar__btn"
          onClick={onExport}
        >
          {exportLabel}
        </button>
      </div>
    </div>
  );
}