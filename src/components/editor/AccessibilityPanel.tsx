import { useId, type ReactNode } from "react";
import type { LongDescriptionSections } from "../../types/longDescription";
import '../../components/editor/editor.css'
import { logResearchEvent } from "../../lib/logResearchEvent";
type Props = {
  title: string;
  shortAlt: string;
  longDescriptionSections: LongDescriptionSections;
  summaryStale: boolean;
  expanded: boolean;
  onToggle: (next: boolean) => void;
  /** The editing controls shown when the panel is open. */
  children?: ReactNode;
};

/** First line of some text, cut to about `max` characters with an ellipsis. */
function glimpse(text: string, max = 90) {
  const line = (text.split(/\r?\n/).find((l) => l.trim()) ?? "").trim();
  if (line.length <= max) return line;
  return `${line.slice(0, max).trimEnd()}…`;
}

export default function AccessibilityPanel({
  title,
  shortAlt,
  longDescriptionSections,
  summaryStale,
  expanded,
  onToggle,
  children,
}: Props) {
  const bodyId = useId();
  const totalSections = Object.keys(longDescriptionSections).length;

  const completedSections = Object.values(longDescriptionSections).filter(
    (section) => section.included && section.text.trim()
  ).length;

  const hasTitle = title.trim().length > 0;
  const hasShortAlt = shortAlt.trim().length > 0;

  return (
    <section
      className={
        expanded
          ? "accessibility-summary-bar accessibility-summary-bar--open"
          : "accessibility-summary-bar"
      }
      aria-label="STEM image accessibility"
    >
      <div className="accessibility-summary-bar__head">
        <h2 className="accessibility-summary-bar__title">
          <button
            type="button"
            className="accessibility-summary-bar__toggle"
            aria-expanded={expanded}
            aria-controls={bodyId}
            onClick={() => {
              const next = !expanded;
              if (next) {
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
              }
              onToggle(next);
            }}
          >
            <span aria-hidden="true" className="accessibility-summary-bar__chevron">
              {expanded ? "▾" : "▸"}
            </span>
            Accessibility
          </button>
        </h2>

        <div className="accessibility-summary-bar__stats">
          <div className="accessibility-summary-chip accessibility-summary-chip--text">
            <span className="accessibility-summary-chip__label">Title</span>
            <span className="accessibility-summary-chip__value">
              {hasTitle ? glimpse(title, 40) : "Missing"}
            </span>
          </div>

          <div
            className="accessibility-summary-chip accessibility-summary-chip--text accessibility-summary-chip--grow"
            title={hasShortAlt ? shortAlt : undefined}
          >
            <span className="accessibility-summary-chip__label">Alt text</span>
            <span className="accessibility-summary-chip__value">
              {hasShortAlt ? glimpse(shortAlt, 400) : "Missing"}
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
      </div>

      <div id={bodyId} className="accessibility-summary-bar__body" hidden={!expanded}>
        {expanded ? children : null}
      </div>
    </section>
  );
}
