// src/components/charts/PermalinkBar.tsx
interface Props {
  permalinkUrl: string | null;
  onCreatePermalink: () => void;
  isSaving: boolean;
  disabled?: boolean;
}

export function PermalinkBar({ permalinkUrl, onCreatePermalink, isSaving, disabled }: Props) {
  const handleCopy = async () => {
    if (!permalinkUrl) return;
    await navigator.clipboard.writeText(permalinkUrl);
  };

  return (
    <section className="card">
      <h2>Permalink</h2>

      <button onClick={onCreatePermalink} disabled={disabled || isSaving}>
        {isSaving ? "Creating…" : "Create permalink"}
      </button>

      {permalinkUrl && (
        <div className="permalink-display">
          <code>{permalinkUrl}</code>
          <button onClick={handleCopy}>Copy</button>
        </div>
      )}
    </section>
  );
}
