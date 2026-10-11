// src/components/export/ExportTextSection.tsx
import "./styles/Text.css";
import "./styles/export.css";
type Props = {
  shortAlt: string;
  longDescriptionPlainText: string;
  onCopyAltText: () => void;
  onCopyLongDescription: () => void;
  onDownloadLongDescriptionTxt: () => void;
  onDownloadLongDescriptionMarkdown?: () => void;
};

export default function ExportTextSection({
  shortAlt,
  longDescriptionPlainText,
  onCopyAltText,
  onCopyLongDescription,
  onDownloadLongDescriptionTxt,
  onDownloadLongDescriptionMarkdown,
}: Props) {
  return (
    <section className="export-section" aria-labelledby="export-text-heading">
      <div className="export-section__header">
        <h2 id="export-text-heading" className="export-section__title">
          Text alternatives
        </h2>
        <p className="export-section__description">
          Use these in course materials, websites, slides, and documents.
        </p>
      </div>

      <div className="export-text-grid">
        <article
          className="export-block export-text-card"
          aria-labelledby="export-short-alt-title"
        >
          <div className="export-block__header">
            <div>
              <h3 id="export-short-alt-title" className="export-block__title">
                Short alt text
              </h3>
              <p className="export-block__description">
                Best for the image alt field in LMS pages, slides, and websites.
              </p>
            </div>

            <div className="export-actions">
              <button type="button" className="btn" onClick={onCopyAltText}>
                Copy alt text
              </button>
            </div>
          </div>

          <div
            className="export-preview export-preview--compact"
            aria-label="Short alt text preview"
          >
            {shortAlt?.trim() || "No short alt text available."}
          </div>
        </article>

        <article
          className="export-block export-text-card"
          aria-labelledby="export-long-description-title"
        >
          <div className="export-block__header">
            <div>
              <h3
                id="export-long-description-title"
                className="export-block__title"
              >
                Long description
              </h3>
              <p className="export-block__description">
                Best when readers need a fuller explanation of the STEM image.
              </p>
            </div>

            <div className="export-actions export-actions--stacked">
              <button
                type="button"
                className="btn"
                onClick={onCopyLongDescription}
              >
                Copy long description
              </button>

              <div className="export-actions export-actions--downloads">
                <button
                  type="button"
                  className="btn"
                  onClick={onDownloadLongDescriptionTxt}
                >
                  Download .txt
                </button>

                {onDownloadLongDescriptionMarkdown ? (
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={onDownloadLongDescriptionMarkdown}
                  >
                    Download .md
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div
            className="export-preview export-preview--scrollable"
            aria-label="Long description preview"
          >
            {longDescriptionPlainText?.trim() ||
              "No long description available."}
          </div>
        </article>
      </div>
    </section>
  );
}