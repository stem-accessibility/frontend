import { useMemo, useEffect } from "react";
import { logResearchEvent } from "../../lib/logResearchEvent";
import LongDescriptionSectionCard from "./LongDescriptionSectionCard";
import LongDescriptionPreview from "./LongDescriptionPreview";
import {
  buildLongDescriptionMarkdown,
  LONG_DESCRIPTION_SECTION_META,
} from "../../services/longDescription";
import type {
  LongDescriptionSections,
  LongDescriptionSectionKey,
} from "../../types/longDescription";
import "./styles/longdesc.css";

type Props = {
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

export default function LongDescriptionPanel({
  sections,
  onSectionChange,
  onSectionToggle,
}: Props) {
  const markdown = useMemo(() => {
    return buildLongDescriptionMarkdown(sections);
  }, [sections]);

  useEffect(() => {
  logResearchEvent({
    event_type: "Long_Description_Viewed",
    editor_mode: "visual",
    success: true,
    event_data: {
      source_page: "LongDescriptionPanel",
      view_mode: "panel",
      section_count: Object.keys(sections).length,
      included_section_count: Object.values(sections).filter((s) => s.included).length,
      filled_section_count: Object.values(sections).filter((s) => s.text.trim()).length,
    },
  });
}, []);

  return (
    <div className="long-desc-card">
      <div className="long-desc-header">
        <div>
          <h2 className="sidebar-card__title" style={{ margin: 0 }}>
            Long description
          </h2>
          <p className="long-desc-subtitle">
            Write the detailed accessible description in guided sections. The
            final output updates automatically.
          </p>
        </div>
      </div>

      <div className="long-desc-split">
        <div className="long-desc-pane long-desc-pane--editor">
          <div className="long-desc-pane__header">Edit description</div>

          <div className="long-description-sections">
            {(Object.keys(
              LONG_DESCRIPTION_SECTION_META
            ) as LongDescriptionSectionKey[]).map((key) => {
              const meta = LONG_DESCRIPTION_SECTION_META[key];
              const section = sections[key];

              return (
                <LongDescriptionSectionCard
                  key={key}
                  sectionKey={key}
                  title={meta.title}
                  helperText={meta.helperText}
                  value={section.text}
                  included={section.included}
                  onChange={(next) => {
  onSectionChange(key, next);
}}

onToggle={(next) => {
  logResearchEvent({
    event_type: "Long_Description_Edited",
    editor_mode: "visual",
    success: true,
    event_data: {
      source_page: "LongDescriptionPanel",
      edit_type: "section_toggle",
      section_key: key,
      section_title: meta.title,
      included: next,
    },
  });

  onSectionToggle(key, next);
}}
                />
              );
            })}
          </div>
        </div>

        <div className="long-desc-pane long-desc-pane--preview">
          <div className="long-desc-pane__header">Preview final output</div>
          <LongDescriptionPreview markdown={markdown} />
        </div>
      </div>
    </div>
  );
}