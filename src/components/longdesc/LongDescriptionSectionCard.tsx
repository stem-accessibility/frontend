import type { LongDescriptionSectionKey } from "../../types/longDescription";
import { useRef } from "react";

import { logResearchEvent } from "../../lib/logResearchEvent";
type Props = {
  sectionKey: LongDescriptionSectionKey;
  title: string;
  helperText: string;
  value: string;
  included: boolean;
  onChange: (next: string) => void;
  onToggle: (included: boolean) => void;
};

export default function LongDescriptionSectionCard({
  sectionKey,
  title,
  helperText,
  value,
  included,
  onChange,
  onToggle,
}: Props) {
  const textareaId = `long-desc-${sectionKey}`;
  const helpId = `${textareaId}-help`;

  const initialValueRef = useRef(value);

  return (
    <section
      className={`long-description-section-card ${
        !included ? "long-description-section-card--muted" : ""
      }`}
    >
      <div className="long-description-section-card__header">
        <div>
          <h3 className="long-description-section-card__title">{title}</h3>
          <p
            id={helpId}
            className="long-description-section-card__help"
          >
            {helperText}
          </p>
        </div>

        <label className="long-description-section-card__toggle">
          <input
            type="checkbox"
            checked={included}
            onChange={(e) => onToggle(e.target.checked)}
          />
          Include
        </label>
      </div>

      <label className="sr-only" htmlFor={textareaId}>
        {title}
      </label>

      <textarea
        id={textareaId}
        className="alt-text-editor long-description-section-card__textarea"
        aria-describedby={helpId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => {
    const oldValue = initialValueRef.current;
    const newValue = value;

    if (oldValue !== newValue) {
      logResearchEvent({
        event_type: "Long_Description_Edited",
        editor_mode: "visual",
        success: true,
        event_data: {
          source_page: "LongDescriptionSectionCard",
          section_key: sectionKey,
          section_title: title,
          old_length: oldValue.length,
          new_length: newValue.length,
          old_empty: oldValue.trim().length === 0,
          new_empty: newValue.trim().length === 0,
        },
      });

      initialValueRef.current = newValue;
    }
  }}
        rows={
          sectionKey === "keyComponents" || sectionKey === "traversal" ? 5 : 4
        }
        placeholder={`Write the ${title.toLowerCase()} section...`}
        disabled={!included}
      />
    </section>
  );
}