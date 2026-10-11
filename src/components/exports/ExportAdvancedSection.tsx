// src/components/export/ExportAdvancedSection.tsx

type Props = {
  hasStructuredJson: boolean;
  onDownloadStructuredJson?: () => void;
};

export default function ExportAdvancedSection({
  hasStructuredJson,
  onDownloadStructuredJson,
}: Props) {
  return (
    <section className="export-section" aria-labelledby="export-advanced-heading">
      <h2 id="export-advanced-heading" className="export-section__title">
        Advanced
      </h2>

      <div className="export-block">
        <div className="export-block__header">
          <div>
            <h3 className="export-block__title">Structured data (JSON)</h3>
            <p className="export-block__description">
              Use this for reuse in other tools or accessibility workflows.
            </p>
          </div>

          <div className="export-actions">
            <button
              type="button"
              className="btn"
              onClick={onDownloadStructuredJson}
              disabled={!hasStructuredJson || !onDownloadStructuredJson}
            >
              Download JSON
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}