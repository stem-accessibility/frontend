import { useId } from "react";
import { DIAGRAM_TYPES } from "../../arboretum/diagramTypes";
import type { DiagramType } from "../../arboretum/diagramTypes";

type Props = {
  value: DiagramType;
  onChange: (next: DiagramType) => void;
};

/** The image type decides which representations and descriptions are produced. */
export default function ImageTypeSelect({ value, onChange }: Props) {
  const id = useId();
  const hint = DIAGRAM_TYPES.find((t) => t.value === value)?.hint;
  return (
    <div className="image-type">
      <label className="image-type__label" htmlFor={`${id}-select`}>
        Image type
      </label>
      <select
        id={`${id}-select`}
        className="image-type__select"
        value={value}
        aria-describedby={`${id}-hint`}
        onChange={(e) => onChange(e.target.value as DiagramType)}
      >
        {DIAGRAM_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      <span id={`${id}-hint`} className="image-type__hint">
        {hint}
      </span>
    </div>
  );
}
