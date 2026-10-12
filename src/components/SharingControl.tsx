import { useId, useState } from "react";
import { IMAGE_SHARING_HELP, SHARING_OPTIONS, type Sharing } from "../lib/sharing";
import "./styles/SharingControl.css";

type Props = {
  sharing: Sharing;
  imagePublic: boolean;
  /** Whether there is an uploaded source image to share. */
  hasImage: boolean;
  /** Save the new setting; reject to show an error and keep the old value. */
  onSave: (next: { sharing: Sharing; imagePublic: boolean }) => Promise<void>;
  /** A short note shown under the control, e.g. "Saved with the next save". */
  hint?: string;
  disabled?: boolean;
  /** Smaller layout for toolbars and cards (no per-option description). */
  compact?: boolean;
  /** Page link to show when the image is shared (path such as /p/abc). */
  publicPath?: string | null;
};

export default function SharingControl({
  sharing,
  imagePublic,
  hasImage,
  onSave,
  hint,
  disabled,
  compact,
  publicPath,
}: Props) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function commit(next: { sharing: Sharing; imagePublic: boolean }) {
    setBusy(true);
    setMessage(null);
    try {
      await onSave(next);
      setMessage({ kind: "ok", text: "Saved." });
    } catch (e) {
      setMessage({
        kind: "error",
        text: `Could not update sharing: ${e instanceof Error ? e.message : "try again"}`,
      });
    } finally {
      setBusy(false);
    }
  }

  const current = SHARING_OPTIONS.find((o) => o.value === sharing) ?? SHARING_OPTIONS[2];
  const showImage = hasImage && sharing !== "private";

  return (
    <div className={compact ? "sharing sharing--compact" : "sharing"}>
      <div className="sharing__row">
        <label className="sharing__label" htmlFor={`${id}-select`}>
          Who can see it
        </label>
        <select
          id={`${id}-select`}
          className="sharing__select"
          value={sharing}
          disabled={disabled || busy}
          aria-describedby={compact ? undefined : `${id}-help`}
          onChange={(e) => commit({ sharing: e.target.value as Sharing, imagePublic })}
        >
          {SHARING_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {!compact && (
        <p id={`${id}-help`} className="sharing__help">
          {current.help}
        </p>
      )}

      {showImage && (
        <label className="sharing__check">
          <input
            type="checkbox"
            checked={imagePublic}
            disabled={disabled || busy}
            onChange={(e) => commit({ sharing, imagePublic: e.target.checked })}
          />
          <span>
            Show the source image on the shared page
            {!compact && <span className="sharing__help"> — {IMAGE_SHARING_HELP}</span>}
          </span>
        </label>
      )}

      {publicPath && sharing !== "private" && (
        <a className="sharing__link" href={publicPath} target="_blank" rel="noopener noreferrer">
          Open shared page<span className="sr-only"> (opens in a new tab)</span>
        </a>
      )}

      {hint && <p className="sharing__help">{hint}</p>}

      <p
        className={message?.kind === "error" ? "sharing__msg sharing__msg--error" : "sharing__msg"}
        role={message?.kind === "error" ? "alert" : "status"}
        aria-live="polite"
      >
        {message?.text ?? ""}
      </p>
    </div>
  );
}
