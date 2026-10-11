import type { LongDescriptionSections } from "../../types/longDescription";
import '../../components/editor/editor.css'
import { logResearchEvent } from "../../lib/logResearchEvent";
type Props = {
  title: string;
  shortAlt: string;
  longDescriptionSections: LongDescriptionSections;
  summaryStale: boolean;
  onOpenAccessibilityEditor: () => void;
};

export default function AccessibilityPanel({
  title,
  shortAlt,
  longDescriptionSections,
  summaryStale,
  onOpenAccessibilityEditor,
}: Props) {
  const totalSections = Object.keys(longDescriptionSections).length;

  const completedSections = Object.values(longDescriptionSections).filter(
    (section) => section.included && section.text.trim()
  ).length;

  const hasTitle = title.trim().length > 0;
  const hasShortAlt = shortAlt.trim().length > 0;

  return (
    <section
      className="accessibility-summary-bar"
      aria-label="STEM image accessibility summary"
    >
      <div className="accessibility-summary-bar__intro">
        <h2 className="accessibility-summary-bar__title">Accessibility</h2>
        <p className="accessibility-summary-bar__text">
          Keep the accessible text up to date as you refine the diagram.
        </p>
      </div>

      <div className="accessibility-summary-bar__stats">
        <div className="accessibility-summary-chip">
          <span className="accessibility-summary-chip__label">Title</span>
          <span className="accessibility-summary-chip__value">
            {hasTitle ? "Added" : "Missing"}
          </span>
        </div>

        <div className="accessibility-summary-chip">
          <span className="accessibility-summary-chip__label">Short alt</span>
          <span className="accessibility-summary-chip__value">
            {hasShortAlt ? "Added" : "Missing"}
          </span>
        </div>

        <div className="accessibility-summary-chip">
          <span className="accessibility-summary-chip__label">
            Long description
          </span>
          <span className="accessibility-summary-chip__value">
            {completedSections} of {totalSections} filled
          </span>
        </div>

        {summaryStale && (
          <div className="accessibility-summary-chip accessibility-summary-chip--warn">
            <span className="accessibility-summary-chip__value">
              Needs refresh after edits
            </span>
          </div>
        )}
      </div>

      <div className="accessibility-summary-bar__actions">
        <button
          type="button"
          className="btn"
         onClick={() => {
            logResearchEvent({
              event_type: "AI_Assist_Opened",
              editor_mode: "visual",
              success: true,
              event_data: {
                source_page: "AccessibilityPanel",
                assist_type: "accessibility_editor",
                has_title: hasTitle,
                has_short_alt: hasShortAlt,
                completed_longdesc_sections: completedSections,
                total_longdesc_sections: totalSections,
                summary_stale: summaryStale,
              },
            });

            onOpenAccessibilityEditor();
          }}
        >
          Open accessibility editor
        </button>
      </div>
    </section>
  );
}