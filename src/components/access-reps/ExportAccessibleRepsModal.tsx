import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../../lib/api";
import QRCodeGenerator from "./QRCode";
import ExportTextSection from "../exports/ExportTextSection";
import ExportHtmlSection from "../exports/ExportHtmlSection";
//import ExportLinksSection from "../exports/ExportLinksSection";
//import ExportAdvancedSection from "../exports/ExportAdvancedSection";
import {
  buildPlainTextFromMarkdown,
  buildInlineHtmlSnippet,
  buildSelfHostedLinkedHtmlSnippet,
  buildSelfHostedLongDescriptionPageHtml,
  buildPermalinkLinkedHtmlSnippet,
  buildSelfHostedDescriptionFileName,
  buildDiagramVisualForExport,
  copyToClipboard,
  downloadTextFile,
  downloadHtmlFile,
}  from "../exports/export-utils";
import type { FlowchartData } from "../../types/types";
import SharingControl from "../SharingControl";
import type { Sharing } from "../../lib/sharing";
import './styles/ExportModal.css'
import { logResearchEvent } from "../../lib/logResearchEvent";

import { jsonToMermaid } from "../../services/utils";

type Props = {
  isOpen: boolean;
  onClose: () => void;

  flowchartId: string | null;
  json: FlowchartData;

  title: string;
  shortAlt: string;
  summary: string;
  imageUrl?: string | null;

  isPublished?: boolean;
  publicSlug?: string | null;

  repoVisibility?: "public" | "private";
  onSetRepoVisibility?: (makePublic: boolean) => void;

  onPublishedChange?: (next: {
    is_published: boolean;
    public_slug: string | null;
    published_at?: string | null;
  }) => void;

  isDirty: boolean;
  onRequestSave: () => void;
};

export default function ExportAccessibleRepsModal({
  isOpen,
  onClose,
  flowchartId,
  json,
  title,
  shortAlt,
  summary,
  imageUrl,
  isPublished = false,
  publicSlug = null,
  repoVisibility = "private",
  onPublishedChange,
  isDirty,
  onRequestSave,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [sharingOverride, setSharingOverride] = useState<Sharing | null>(null);

  const [_copiedPrivateLink, setCopiedPrivateLink] = useState(false);
  const [copiedPublicLink, setCopiedPublicLink] = useState(false);

  const closeButtonRef = useRef<HTMLButtonElement | null>(null);


  // Reset the local choice when a different STEM image is shown or the dialog reopens.
  useEffect(() => {
    setSharingOverride(null);
  }, [flowchartId, isOpen]);

  const sharing: Sharing =
    sharingOverride ??
    (isPublished ? (repoVisibility === "public" ? "public" : "link") : "private");

  const publicUrl =
    isPublished && publicSlug
      ? `${window.location.origin}/p/${publicSlug}`
      : null;


  const longDescriptionPlainText = useMemo(() => {
    return buildPlainTextFromMarkdown(summary || "");
  }, [summary]);

  const inlineHtmlSnippet = useMemo(() => {
    return buildInlineHtmlSnippet({
      title,
      imageUrl,
      shortAlt,
      longDescriptionMarkdown: summary,
    });
  }, [title, imageUrl, shortAlt, summary]);

 
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setCopiedPrivateLink(false);
    setCopiedPublicLink(false);

    window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const baseFileName = (title || "diagram")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");


  const selfHostedDescriptionFileName = buildSelfHostedDescriptionFileName(title);

const selfHostedLinkedSnippet = useMemo(() => {
  return buildSelfHostedLinkedHtmlSnippet({
    title,
    imageUrl,
    shortAlt,
    descriptionHref: selfHostedDescriptionFileName,
  });
}, [title, imageUrl, shortAlt, selfHostedDescriptionFileName]);

const selfHostedLongDescriptionPageHtml = useMemo(() => {
  return buildSelfHostedLongDescriptionPageHtml({
    title,
    imageUrl,
    shortAlt,
    longDescriptionMarkdown: summary,
  });
}, [title, imageUrl, shortAlt, summary]);

const permalinkLinkedSnippet = useMemo(() => {
  if (!publicUrl) return null;

  return buildPermalinkLinkedHtmlSnippet({
    title,
    imageUrl,
    shortAlt,
    descriptionHref: publicUrl,
  });
}, [title, imageUrl, shortAlt, publicUrl]);
  const copyWithFlash = async (
    text: string,
    setCopied?: (next: boolean) => void
  ) => {
    await copyToClipboard(text);
    if (setCopied) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    }
  };
 const logFinalExportSnapshot = async (exportType: string) => {
  try {
    if (flowchartId) {
      await apiFetch(`/flowcharts/${encodeURIComponent(flowchartId)}/finalize-export`, {
        method: "POST",
        json: { export_type: exportType },
      });
    }

    logExportSucceeded(exportType);
  } catch (e) {
    console.error("Failed to log final export snapshot", e);
    logExportFailed(exportType, e);
  }
};
  /** One setting for who can see this STEM image (same control as the editor and Dashboard). */
  const saveSharing = async (next: { sharing: Sharing; imagePublic: boolean }) => {
    setError(null);
    if (!flowchartId) {
      setError("Save the STEM image first. Sharing needs a saved STEM image.");
      throw new Error("Not saved yet");
    }
    if (isDirty) {
      setError("You have unsaved changes. Save the STEM image before changing sharing.");
      throw new Error("Unsaved changes");
    }
    if (next.sharing !== "private" && !summary?.trim()) {
      setError("Add or generate the long description before sharing.");
      throw new Error("No long description");
    }

    const publish = next.sharing !== "private";
    logResearchEvent({
      event_type: publish ? "Publish_Clicked" : "Unpublish_Clicked",
      editor_mode: "visual",
      flowchart_id: flowchartId,
      success: true,
      event_data: {
        source_page: "ExportAccessibleRepsModal",
        sharing: next.sharing,
        had_existing_slug: Boolean(publicSlug),
        is_dirty: isDirty,
      },
    });

    try {
      const updated = await apiFetch<{
        sharing: Sharing;
        is_published: boolean;
        public_slug: string | null;
        published_at: string | null;
      }>(`/flowcharts/${encodeURIComponent(flowchartId)}/sharing`, {
        method: "PUT",
        json: { sharing: next.sharing, image_public: next.imagePublic },
      });
      setSharingOverride(updated.sharing);
      onPublishedChange?.({
        is_published: updated.is_published,
        public_slug: updated.public_slug,
        published_at: updated.published_at,
      });
      logResearchEvent({
        event_type: publish ? "Publish_Succeeded" : "Unpublish_Succeeded",
        editor_mode: "visual",
        flowchart_id: flowchartId,
        success: true,
        event_data: {
          source_page: "ExportAccessibleRepsModal",
          sharing: updated.sharing,
          public_slug: updated.public_slug,
        },
      });
    } catch (e: any) {
      logResearchEvent({
        event_type: publish ? "Publish_Failed" : "Unpublish_Failed",
        editor_mode: "visual",
        flowchart_id: flowchartId,
        success: false,
        event_data: {
          source_page: "ExportAccessibleRepsModal",
          sharing: next.sharing,
          error_message: e?.message || String(e),
        },
      });
      throw e;
    }
  };

 const handleCopyAltText = async () => {
  await copyToClipboard(shortAlt || "");
  await logFinalExportSnapshot("alt_text_copy");
};

const handleCopyLongDescription = async () => {
  await copyToClipboard(longDescriptionPlainText || "");
  await logFinalExportSnapshot("long_description_copy");
};

 const handleDownloadLongDescriptionTxt = async () => {
  downloadTextFile(
    `${baseFileName}-long-description.txt`,
    longDescriptionPlainText
  );
  await logFinalExportSnapshot("long_description_txt");
};

const handleDownloadLongDescriptionMarkdown = async () => {
  downloadTextFile(
    `${baseFileName}-long-description.md`,
    summary,
    "text/markdown;charset=utf-8"
  );
  await logFinalExportSnapshot("long_description_markdown");
};

 const handleCopyInlineHtml = async () => {
  await copyToClipboard(inlineHtmlSnippet);
  await logFinalExportSnapshot("inline_html_copy");
};

const handleDownloadInlineHtml = async () => {
  downloadHtmlFile(`${baseFileName}-inline.html`, inlineHtmlSnippet);
  await logFinalExportSnapshot("inline_html_download");
};

const handleCopySelfHostedLinkedSnippet = async () => {
  await copyToClipboard(selfHostedLinkedSnippet);
  await logFinalExportSnapshot("self_hosted_linked_snippet_copy");
};

const handleDownloadSelfHostedLinkedSnippet = async () => {
  downloadHtmlFile(
    `${baseFileName}-linked-snippet.html`,
    selfHostedLinkedSnippet
  );
  await logFinalExportSnapshot("self_hosted_linked_snippet_download");
};


const handleDownloadSelfHostedLongDescriptionPage = async () => {
  const mermaidCode = jsonToMermaid(json);

  const visual = await buildDiagramVisualForExport({
    mermaidCode,
    imageUrl,
  });

  const html = buildSelfHostedLongDescriptionPageHtml({
    title,
    shortAlt,
    longDescriptionMarkdown: summary,
    svgMarkup: visual.kind === "svg" ? visual.svgMarkup : null,
    imageUrl: visual.kind === "image" ? visual.imageUrl : null,
  });

  downloadHtmlFile(
    selfHostedDescriptionFileName,
    html
  );

  await logFinalExportSnapshot("self_hosted_long_description_page_download");
};

const handleCopyPermalinkLinkedSnippet = async () => {
  if (!permalinkLinkedSnippet) return;
  await copyToClipboard(permalinkLinkedSnippet);
  await logFinalExportSnapshot("permalink_linked_snippet_copy");
};

const handleDownloadPermalinkLinkedSnippet = async () => {
  if (!permalinkLinkedSnippet) return;
  downloadHtmlFile(
    `${baseFileName}-accessflow-hosted.html`,
    permalinkLinkedSnippet
  );
  await logFinalExportSnapshot("permalink_linked_snippet_download");
};

const handleCopyPublicLink = async () => {
    if (!publicUrl) return;
    await copyWithFlash(publicUrl, setCopiedPublicLink);
  };

  const getExportEventData = (exportType: string) => ({
  source_page: "ExportAccessibleRepsModal",
  export_type: exportType,
  has_short_alt: Boolean(shortAlt?.trim()),
  has_long_description: Boolean(summary?.trim()),
  node_count: json.nodes?.length ?? 0,
  edge_count: json.edges?.length ?? 0,
  is_published: isPublished,
  is_dirty: isDirty,
});

const logExportSucceeded = (exportType: string) => {
  logResearchEvent({
    event_type: "Export_Succeeded",
    editor_mode: "visual",
    flowchart_id: flowchartId ?? undefined,
    success: true,
    event_data: getExportEventData(exportType),
  });
};

const logExportFailed = (exportType: string, error: unknown) => {
  logResearchEvent({
    event_type: "Export_Failed",
    editor_mode: "visual",
    flowchart_id: flowchartId ?? undefined,
    success: false,
    event_data: {
      ...getExportEventData(exportType),
      error_message: error instanceof Error ? error.message : String(error),
    },
  });
};

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="modal-card export-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-reps-modal-title"
        aria-describedby="export-reps-modal-description"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 id="export-reps-modal-title" className="modal-title">
              Export accessible representations
            </h2>
            <p
              id="export-reps-modal-description"
              style={{ margin: "8px 0 0", opacity: 0.8 }}
            >
              Copy, download, or share accessible versions of this diagram.
              Public publishing is optional and only needed for hosted long-description links and QR codes.
            </p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            className="canvas-toolbar__btn"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {error ? <div className="banner banner--error">{error}</div> : null}

        <div
          className="export-modal__body"
          style={{
            display: "grid",
            gap: 24,
            maxHeight: "70vh",
            overflowY: "auto",
            paddingRight: 4,
          }}
        >
          <ExportTextSection
            shortAlt={shortAlt}
            longDescriptionPlainText={longDescriptionPlainText}
            onCopyAltText={handleCopyAltText}
            onCopyLongDescription={handleCopyLongDescription}
            onDownloadLongDescriptionTxt={handleDownloadLongDescriptionTxt}
            onDownloadLongDescriptionMarkdown={handleDownloadLongDescriptionMarkdown}
          />

          <ExportHtmlSection
            inlineHtmlSnippet={inlineHtmlSnippet}
            selfHostedLinkedSnippet={selfHostedLinkedSnippet}
            selfHostedLongDescriptionPageHtml={selfHostedLongDescriptionPageHtml}
            permalinkLinkedSnippet={permalinkLinkedSnippet}
            hasPublishedPermalink={Boolean(publicUrl)}
            onCopyInlineHtml={handleCopyInlineHtml}
            onDownloadInlineHtml={handleDownloadInlineHtml}
            onCopySelfHostedLinkedSnippet={handleCopySelfHostedLinkedSnippet}
            onDownloadSelfHostedLinkedSnippet={handleDownloadSelfHostedLinkedSnippet}
            onDownloadSelfHostedLongDescriptionPage={handleDownloadSelfHostedLongDescriptionPage}
            onCopyPermalinkLinkedSnippet={handleCopyPermalinkLinkedSnippet}
            onDownloadPermalinkLinkedSnippet={handleDownloadPermalinkLinkedSnippet}
          />

        {/*   <ExportLinksSection
            privatePreviewUrl={privatePreviewUrl}
            publicUrl={publicUrl}
            isPublished={isPublished}
            onCopyPrivateLink={handleCopyPrivateLink}
            onCopyPublicLink={handleCopyPublicLink}
          /> */}

          <section className="export-section" aria-labelledby="public-sharing-heading">
            <h3 id="public-sharing-heading" className="export-section__title">
              Public sharing (optional)
            </h3>

            {!flowchartId ? (
              <div className="banner banner--warn">
                Save the diagram first to enable preview links, public publishing, and QR code access.
              </div>
            ) : isDirty ? (
              <div
                className="banner banner--warn"
                style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}
              >
                <div style={{ flex: 1 }}>
                  You have <strong>unsaved changes</strong>. Save before publishing or unpublishing.
                </div>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={onRequestSave}
                >
                  Save now
                </button>
              </div>
            ) : (
              <div className="export-block">
                <div className="export-block__header">
                  <div>
                    <h4 className="export-block__title">Public link and QR code</h4>
                    <p className="export-block__description">
                      Sharing creates a hosted page for the long description. This is useful for sharing,
                      printed materials, and QR-based access, but it is not required to export accessible text or HTML.
                    </p>
                  </div>

                  <div className="export-actions">
                    <SharingControl
                      sharing={sharing}
                      imagePublic={false}
                      hasImage={false}
                      onSave={saveSharing}
                    />
                  </div>
                </div>

                {isPublished && publicUrl ? (
                  <>
                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        flexWrap: "wrap",
                        marginBottom: 12,
                      }}
                    >
                      <a
                        href={publicUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => {
                          logResearchEvent({
                            event_type: "Preview_Clicked",
                            editor_mode: "visual",
                            flowchart_id: flowchartId ?? undefined,
                            success: true,
                            event_data: {
                              source_page: "ExportAccessibleRepsModal",
                              preview_type: "public_permalink",
                              public_slug: publicSlug,
                            },
                          });
                        }}
                      >
                        Open public link
                      </a>
                      <button
                        type="button"
                        className="btn btn--outline"
                        onClick={handleCopyPublicLink}
                      >
                        {copiedPublicLink ? "Copied!" : "Copy public link"}
                      </button>
                    </div>

                    <div>
                      <QRCodeGenerator permalink={publicUrl} />
                    </div>
                  </>
                ) : (
                  <p className="export-block__description" style={{ marginTop: 0 }}>
                    This diagram is not currently published publicly.
                  </p>
                )}
              </div>
            )}
          </section>
        {/* 
          <ExportAdvancedSection
            hasStructuredJson={Boolean(json)}
            onDownloadStructuredJson={handleDownloadStructuredJson}
          /> */}
        </div>
      </div>
    </div>
  );
}