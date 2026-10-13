// src/components/charts/PermalinkBar.tsx
import type { ReactNode } from "react";

interface Props {
  permalinkUrl: string | null;
  onCreatePermalink: () => void;
  isSaving: boolean;
  disabled?: boolean;
  /** Shown above the button, for example why saving is not available. */
  note?: ReactNode;
}

export function PermalinkBar({ permalinkUrl, onCreatePermalink, isSaving, disabled, note }: Props) {
  const handleCopy = async () => {
    if (!permalinkUrl) return;
    await navigator.clipboard.writeText(permalinkUrl);
  };

  return (
    <section className="card" aria-labelledby="permalink-heading">
      <h2 id="permalink-heading">Permalink</h2>
      <p className="hint">
        Saves this data, its settings and any specification to your account and gives you a link anyone can
        open. Changing the chart afterwards does not change a link you already made.
      </p>

      {note}

      <button type="button" onClick={onCreatePermalink} disabled={disabled || isSaving}>
        {isSaving ? "Creating…" : "Create permalink"}
      </button>

      {/* A status region, so a screen reader hears that the link now exists. */}
      <div role="status" className="permalink-display">
        {permalinkUrl && (
          <>
            <span>Link created: </span>
            <a href={permalinkUrl}>{permalinkUrl}</a>{" "}
            <button type="button" onClick={handleCopy}>
              Copy link
            </button>
          </>
        )}
      </div>
    </section>
  );
}
