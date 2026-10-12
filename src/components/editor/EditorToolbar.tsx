// .mode-tab styles for the Visual / Markdown switch live in this file.
import "../../pages/styles/DiagramUpload.css";
import { useEffect, useState } from "react";
import SharingControl from "../SharingControl";
import type { Sharing } from "../../lib/sharing";
export type EditorMode = "visual" | "mermaid";
type Props = {
  hasImage: boolean;
  onViewImage: () => void;
  onReupload: () => void;
  onSave: () => void;
  isSaving: boolean;
  disableSave?: boolean;

  flowchartId: string | null;
  isPublished: boolean;

  sharing: Sharing;
  imagePublic: boolean;
  publicPath: string | null;
  onSharingSave: (next: { sharing: Sharing; imagePublic: boolean }) => Promise<void>;

 
  isDirty: boolean;
  editorMode: EditorMode;
  onEditorModeChange: (mode: EditorMode) => void;
};

export default function EditorToolbar({
  hasImage,
  onViewImage,
  onSave,
  isSaving,
  disableSave,
  flowchartId,
  sharing,
  imagePublic,
  publicPath,
  onSharingSave,
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
            Markdown
          </button>
        </div>
      </div>

      <div className="canvas-toolbar__spacer" />

      <div
        className="canvas-toolbar__group"
        style={{ display: "flex", gap: 10, alignItems: "center" }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <SharingControl
            compact
            sharing={sharing}
            imagePublic={imagePublic}
            hasImage={hasImage}
            publicPath={publicPath}
            onSave={onSharingSave}
            showImageOption={false}
            copyLabel="Copy permalink"
            showOpenLink={false}
            alwaysShowCopy
          />

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
      </div>
    </div>
  );
}