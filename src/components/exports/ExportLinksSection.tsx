// src/components/export/ExportLinksSection.tsx

type Props = {
  privatePreviewUrl?: string | null;
  publicUrl?: string | null;
  isPublished: boolean;
  onCopyPrivateLink: () => void;
  onCopyPublicLink: () => void;
  onDownloadQrCode?: () => void;
  qrCodeUrl?: string | null;
};

export default function ExportLinksSection({
  privatePreviewUrl,
  publicUrl,
  isPublished,
  onCopyPrivateLink,
  onCopyPublicLink,
  onDownloadQrCode,
  qrCodeUrl,
}: Props) {
  return (
    <section className="export-section" aria-labelledby="export-links-heading">
      <h2 id="export-links-heading" className="export-section__title">
        Share and access links
      </h2>

      <div className="export-block">
        <div className="export-block__header">
          <div>
            <h3 className="export-block__title">Private preview link</h3>
            <p className="export-block__description">
              Use this link for private sharing and review.
            </p>
          </div>
          <div className="export-actions">
            <button
              type="button"
              className="btn"
              onClick={onCopyPrivateLink}
              disabled={!privatePreviewUrl}
            >
              Copy private link
            </button>
          </div>
        </div>

        <textarea
          className="export-readonly-textarea"
          value={privatePreviewUrl ?? ""}
          readOnly
          rows={2}
          aria-label="Private preview link"
        />
      </div>

      <div className="export-block">
        <div className="export-block__header">
          <div>
            <h3 className="export-block__title">Public link</h3>
            <p className="export-block__description">
              Optional public sharing. Not required for text export or compliance workflows.
            </p>
          </div>
          <div className="export-actions">
            <button
              type="button"
              className="btn"
              onClick={onCopyPublicLink}
              disabled={!isPublished || !publicUrl}
            >
              Copy public link
            </button>
          </div>
        </div>

        {!isPublished ? (
          <p className="export-block__description">
            This diagram is not currently published publicly.
          </p>
        ) : (
          <textarea
            className="export-readonly-textarea"
            value={publicUrl ?? ""}
            readOnly
            rows={2}
            aria-label="Public link"
          />
        )}
      </div>

      <div className="export-block">
        <div className="export-block__header">
          <div>
            <h3 className="export-block__title">QR code</h3>
            <p className="export-block__description">
              Use this for printed materials or access on another device.
            </p>
          </div>
          <div className="export-actions">
            <button
              type="button"
              className="btn"
              onClick={onDownloadQrCode}
              disabled={!qrCodeUrl || !onDownloadQrCode}
            >
              Download QR code
            </button>
          </div>
        </div>

        {qrCodeUrl ? (
          <img
            src={qrCodeUrl}
            alt="QR code for the public long description page"
            className="export-qr-image"
          />
        ) : (
          <p className="export-block__description">
            QR code becomes available when a public link exists.
          </p>
        )}
      </div>
    </section>
  );
}