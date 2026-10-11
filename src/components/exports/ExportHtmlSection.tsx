// src/components/export/ExportHtmlSection.tsx
import "./styles/export.css";
import "./styles/HTML.css";


type Props = {
  inlineHtmlSnippet: string;

  selfHostedLinkedSnippet: string;
  selfHostedLongDescriptionPageHtml: string;

  permalinkLinkedSnippet: string | null;
  hasPublishedPermalink: boolean;

  onCopyInlineHtml: () => void;
  onDownloadInlineHtml: () => void;

  onCopySelfHostedLinkedSnippet: () => void;
  onDownloadSelfHostedLinkedSnippet: () => void;
  onDownloadSelfHostedLongDescriptionPage: () => void;

  onCopyPermalinkLinkedSnippet: () => void;
  onDownloadPermalinkLinkedSnippet: () => void;
};

export default function ExportHtmlSection({
  hasPublishedPermalink,
  onCopyInlineHtml,
  onDownloadInlineHtml,
  onCopySelfHostedLinkedSnippet,
  onDownloadSelfHostedLinkedSnippet,
  onDownloadSelfHostedLongDescriptionPage,
  onCopyPermalinkLinkedSnippet,
  onDownloadPermalinkLinkedSnippet,
}: Props) {
  return (
    <section className="export-section" aria-labelledby="export-html-heading">
      <div className="export-section__header">
        <h2 id="export-html-heading" className="export-section__title">
          HTML snippets
        </h2>
        <p className="export-section__description">
          Choose whether the long description lives on the same page, on a page
          you host yourself, or on a published STEM-Accessibility page.
        </p>
      </div>

      <div className="export-html-grid">
        <article
          className="export-block export-html-card"
          aria-labelledby="export-html-inline-title"
        >
          <div className="export-block__header">
            <div>
              <h3 id="export-html-inline-title" className="export-block__title">
                Inline long description
              </h3>
              <p className="export-block__description">
                Best when you want one self-contained HTML block with the long
                description directly on the same page.
              </p>
            </div>

            <div className="export-actions export-actions--stacked">
              <button type="button" className="btn" onClick={onCopyInlineHtml}>
                Copy inline HTML
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={onDownloadInlineHtml}
              >
                Download HTML
              </button>
            </div>
          </div>

          
        </article>

        <article
          className="export-block export-html-card"
          aria-labelledby="export-html-selfhosted-title"
        >
          <div className="export-block__header">
            <div>
              <h3
                id="export-html-selfhosted-title"
                className="export-block__title"
              >
                Linked long description (self-hosted)
              </h3>
              <p className="export-block__description">
                Best when you want a cleaner main page and plan to host the long
                description page yourself.
              </p>
            </div>

            <div className="export-actions export-actions--stacked">
              <button
                type="button"
                className="btn"
                onClick={onCopySelfHostedLinkedSnippet}
              >
                Copy linked snippet
              </button>

              <div className="export-actions export-actions--downloads">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={onDownloadSelfHostedLinkedSnippet}
                >
                  Download snippet
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={onDownloadSelfHostedLongDescriptionPage}
                >
                  Download description page
                </button>
              </div>
            </div>
          </div>

         
        </article>

        <article
          className="export-block export-html-card"
          aria-labelledby="export-html-permalink-title"
        >
          <div className="export-block__header">
            <div>
              <h3
                id="export-html-permalink-title"
                className="export-block__title"
              >
                Linked long description (STEM-Accessibility hosted)
              </h3>
              <p className="export-block__description">
                Uses your published STEM-Accessibility permalink as the long description
                target. This is optional and only works after publishing.
              </p>
            </div>
            {!hasPublishedPermalink ? (
            <p className="export-block__description">
              Share the STEM image first to enable a STEM-Accessibility-hosted linked
              snippet.
            </p>
          ) : (
            <div className="export-actions export-actions--stacked">
              <button
                type="button"
                className="btn"
                onClick={onCopyPermalinkLinkedSnippet}
                disabled={!hasPublishedPermalink}
              >
                Copy hosted-link snippet
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={onDownloadPermalinkLinkedSnippet}
                disabled={!hasPublishedPermalink}
              >
                Download hosted-link HTML
              </button>
            </div>
 )}

          </div>

          
        </article>
      </div>
    </section>
  );
}