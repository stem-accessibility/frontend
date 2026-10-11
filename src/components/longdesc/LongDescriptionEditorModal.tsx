import { useEffect } from "react";
import LongDescriptionPanel from "../longdesc/LongDescriptionPanel";
import type {
  LongDescriptionSections,
  LongDescriptionSectionKey,
} from "../../types/longDescription";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  sections: LongDescriptionSections;
  onSectionChange: (
    section: LongDescriptionSectionKey,
    nextText: string
  ) => void;
  onSectionToggle: (
    section: LongDescriptionSectionKey,
    included: boolean
  ) => void;
};

export default function LongDescriptionEditorModal({
  isOpen,
  onClose,
  sections,
  onSectionChange,
  onSectionToggle,
}: Props) {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="longdesc-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="longdesc-modal-title"
      onClick={onClose}
    >
      <div
        className="longdesc-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="longdesc-modal-header">
          <div>
            <h2 id="longdesc-modal-title" className="longdesc-modal-title">
              Long description editor
            </h2>
            <p className="longdesc-modal-subtitle">
              Edit guided sections and review the final output in a larger
              workspace.
            </p>
          </div>

          <button
            type="button"
            className="longdesc-modal-close"
            onClick={onClose}
            aria-label="Close long description editor"
          >
            ×
          </button>
        </div>

        <div className="longdesc-modal-body">
          <LongDescriptionPanel
            sections={sections}
            onSectionChange={onSectionChange}
            onSectionToggle={onSectionToggle}
          />
        </div>

        <div className="longdesc-modal-footer">
          <button type="button" className="btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}