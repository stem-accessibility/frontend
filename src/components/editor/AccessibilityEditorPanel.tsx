import { useEffect } from "react";
import LongDescriptionPanel from "../longdesc/LongDescriptionPanel";
import type { FlowchartData } from "../../types/types";
import type {
  LongDescriptionSections,
  LongDescriptionSectionKey,
} from "../../types/longDescription";
import { logResearchEvent } from "../../lib/logResearchEvent";

type Props = {
  isOpen: boolean;
  onClose: () => void;

  title: string;
  onTitleChange: (next: string) => void;

  shortAlt: string;
  onShortAltChange: (next: string) => void;

  longDescriptionSections: LongDescriptionSections;
  onLongDescriptionSectionChange: (
    section: LongDescriptionSectionKey,
    nextText: string
  ) => void;
  onLongDescriptionSectionToggle: (
    section: LongDescriptionSectionKey,
    included: boolean
  ) => void;

  summaryStale: boolean;
  onRegenerate: () => void;
  /** Fill the fields from the diagram itself, with no AI call. */
  onAutoDescribe?: () => void;
  isGenerating: boolean;

  imageDataUrl?: string | null;
  flowchartData?: FlowchartData | null;
};

export default function AccessibilityEditorModal({
  isOpen,
  onClose,
  title,
  onTitleChange,
  shortAlt,
  onShortAltChange,
  longDescriptionSections,
  onLongDescriptionSectionChange,
  onLongDescriptionSectionToggle,
  summaryStale,
  onRegenerate,
  onAutoDescribe,
  isGenerating,
  imageDataUrl,
}: Props) {
  useEffect(() => {
    if (!isOpen) return;
    logResearchEvent({
      event_type: "Summary_Viewed",
      editor_mode: "visual",
      success: true,
      event_data: {
        source_page: "AccessibilityEditorModal",
        view_mode: "modal",
      },
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="accessibility-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="accessibility-modal-title"
      onClick={onClose}
    >
      <div
        className="accessibility-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="accessibility-modal-header">
          <div>
            <h2
              id="accessibility-modal-title"
              className="accessibility-modal-title"
            >
              Accessibility editor
            </h2>
            <p className="accessibility-modal-subtitle">
              Refine the title, short alt text, and long description with the
              diagram visible for reference.
            </p>
          </div>

          <button
            type="button"
            className="accessibility-modal-close"
            onClick={onClose}
            aria-label="Close accessibility editor"
          >
            ×
          </button>
        </div>

        <div className="accessibility-modal-body">
          <div className="accessibility-modal-layout">
            <div className="accessibility-modal-authoring">
              <div className="accessibility-modal-section">
                <h3 className="accessibility-modal-section__title">Title</h3>

                <label className="sr-only" htmlFor="accessibility-modal-title-input">
                  Diagram title
                </label>

                <input
                  id="accessibility-modal-title-input"
                  type="text"
                  className="alt-text-editor"
                  value={title}
                  onChange={(e) => {
                    const next = e.target.value;

                    onTitleChange(next);

                    logResearchEvent({
                      event_type: "Flowchart_Renamed",
                      editor_mode: "visual",
                      success: true,
                      event_data: {
                        source_page: "AccessibilityEditorModal",
                        new_title: next,
                      },
                    });
                  }}
                  placeholder="Give this STEM image a short, meaningful title"
                />

                <p className="accessibility-modal-help">
                  Used in previews and permalinks.
                </p>
              </div>

              <div className="accessibility-modal-section">
                <div className="accessibility-modal-section__row">
                  <div>
                    <h3 className="accessibility-modal-section__title">
                      Alt text (short)
                    </h3>
                    <p className="accessibility-modal-help">
                      A short summary of the diagram’s essential content.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      logResearchEvent({
                        event_type: summaryStale
                          ? "Regenerate_Summary_Clicked"
                          : "Generate_Summary_Clicked",
                        editor_mode: "visual",
                        success: true,
                        event_data: {
                          source_page: "AccessibilityEditorModal",
                          generation_mode: "hybrid",
                          model: "gemini-flash-lite-latest",
                        },
                      });

                      onRegenerate();
                    }}
                    disabled={isGenerating}
                  >
                    {isGenerating
                      ? "Generating…"
                      : summaryStale
                      ? "Regenerate"
                      : "Generate / Regenerate"}
                  </button>
                  {onAutoDescribe ? (
                    <button
                      type="button"
                      className="btn"
                      onClick={onAutoDescribe}
                      disabled={isGenerating}
                      style={{ marginLeft: 8 }}
                    >
                      Describe without AI
                    </button>
                  ) : null}
                </div>

                {summaryStale && (
                  <div className="summary-warning" role="status">
                    The accessibility text may be out of date after recent
                    diagram edits.
                  </div>
                )}

                <label className="sr-only" htmlFor="accessibility-modal-shortalt">
                  Short alt text
                </label>

                <textarea
                  id="accessibility-modal-shortalt"
                  className="alt-text-editor"
                  value={shortAlt}
                  onChange={(e) => {
                  const next = e.target.value;

                  onShortAltChange(next);

                  logResearchEvent({
                    event_type: "Short_Alt_Edited",
                    editor_mode: "visual",
                    success: true,
                    event_data: {
                      source_page: "AccessibilityEditorModal",
                      new_length: next.length,
                    },
                  });
                }}rows={4}
                  placeholder="1–2 sentences summarizing the essential content."
                />
              </div>

              <div className="accessibility-modal-section accessibility-modal-section--longdesc">
                <LongDescriptionPanel
                  sections={longDescriptionSections}
                  onSectionChange={onLongDescriptionSectionChange}
                  onSectionToggle={onLongDescriptionSectionToggle}
                />
              </div>
            </div>

            <div className="accessibility-modal-visual">
              <div className="accessibility-modal-visual__header">
                <h3 className="accessibility-modal-section__title">
                  Visual reference
                </h3>
                <p className="accessibility-modal-help">
                  Use this to check structure, wording, and relationships while
                  writing.
                </p>
              </div>

              <div className="accessibility-modal-visual__body">
                {imageDataUrl ? (
                  <img
                    src={imageDataUrl}
                    alt="STEM image reference"
                    className="accessibility-modal-visual__image"
                  />
                ) : (
                  <div className="accessibility-modal-visual__empty">
                    No uploaded image is available for reference.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="accessibility-modal-footer">
          <button type="button" className="btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}