import { useId, useState } from "react";
import QRCodeGenerator from "./QRCode";
import type { FlowchartData } from "../../types/types";
import { jsonToMermaid } from "../../services/utils";
import {
  buildDiagramVisualForExport,
  buildPermalinkLinkedHtmlSnippet,
  buildPlainTextFromMarkdown,
  buildSelfHostedLongDescriptionPageHtml,
  copyToClipboard,
  downloadHtmlFile,
  downloadTextFile,
  markdownToBasicHtml,
} from "../exports/export-utils";
import "./styles/ShareToolbar.css";

type Format = "html" | "markdown" | "text";

type Props = {
  title: string;
  shortAlt: string;
  /** Long description as Markdown. */
  summary: string;
  json: FlowchartData;
  /** Absolute address of the shared page; enables the embed code and QR code. */
  publicUrl?: string | null;
};

const FORMATS: { value: Format; label: string; hint: string }[] = [
  { value: "html", label: "HTML", hint: "Alt text as an alt=\"\" attribute; long description as HTML." },
  { value: "markdown", label: "Markdown", hint: "Plain alt text; long description with headings." },
  { value: "text", label: "Text", hint: "Plain text, no markup." },
];

const escapeAttr = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const fileBase = (title: string) =>
  (title || "stem-image").trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "") ||
  "stem-image";

/**
 * Copy and download the accessible text of a STEM image, plus embed code and a QR code for the
 * shared page. Replaces the old Export dialog; everything it did is here, on the page people see.
 */
export default function ShareToolbar({ title, shortAlt, summary, json, publicUrl }: Props) {
  const id = useId();
  const [format, setFormat] = useState<Format>("text");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const say = (msg: string) => setStatus(msg);

  const altFor = (f: Format) => (f === "html" ? `alt="${escapeAttr(shortAlt)}"` : shortAlt);
  const descriptionFor = (f: Format) =>
    f === "html"
      ? markdownToBasicHtml(summary)
      : f === "markdown"
        ? summary
        : buildPlainTextFromMarkdown(summary);

  async function copy(text: string, what: string) {
    try {
      await copyToClipboard(text);
      say(`Copied ${what}.`);
    } catch {
      say(`Could not copy ${what}. Select the text on the page and copy it instead.`);
    }
  }

  async function download() {
    const base = fileBase(title);
    if (format === "text") {
      downloadTextFile(`${base}-long-description.txt`, descriptionFor("text"));
    } else if (format === "markdown") {
      downloadTextFile(`${base}-long-description.md`, summary, "text/markdown;charset=utf-8");
    } else {
      // A full page, with the diagram drawn into it so it stands on its own.
      setBusy(true);
      try {
        const visual = await buildDiagramVisualForExport({ mermaidCode: jsonToMermaid(json) });
        const html = buildSelfHostedLongDescriptionPageHtml({
          title,
          shortAlt,
          longDescriptionMarkdown: summary,
          svgMarkup: visual.kind === "svg" ? visual.svgMarkup : null,
        });
        downloadHtmlFile(`${base}-long-description.html`, html);
      } finally {
        setBusy(false);
      }
    }
    say(`Downloaded the long description as ${FORMATS.find((f) => f.value === format)?.label}.`);
  }

  const hint = FORMATS.find((f) => f.value === format)?.hint;

  return (
    <section className="share-toolbar" aria-label="Copy, download, and share">
      <div className="share-toolbar__row">
        <fieldset className="share-toolbar__formats">
          <legend>Format</legend>
          {FORMATS.map((f) => (
            <label key={f.value} className="share-toolbar__radio">
              <input
                type="radio"
                name={`${id}-format`}
                value={f.value}
                checked={format === f.value}
                onChange={() => setFormat(f.value)}
                aria-describedby={`${id}-hint`}
              />
              {f.label}
            </label>
          ))}
        </fieldset>

        <div className="share-toolbar__actions">
          <button
            type="button"
            className="btn btn--outline"
            disabled={!shortAlt.trim()}
            onClick={() => copy(altFor(format), "alt text")}
          >
            Copy alt text
          </button>
          <button
            type="button"
            className="btn btn--outline"
            disabled={!summary.trim()}
            onClick={() => copy(descriptionFor(format), "long description")}
          >
            Copy long description
          </button>
          <button
            type="button"
            className="btn btn--outline"
            disabled={!summary.trim() || busy}
            onClick={download}
          >
            {busy ? "Preparing…" : "Download"}
          </button>
          {publicUrl && (
            <button
              type="button"
              className="btn btn--outline"
              onClick={() =>
                copy(
                  buildPermalinkLinkedHtmlSnippet({
                    title,
                    shortAlt,
                    imageUrl: null,
                    descriptionHref: publicUrl,
                  }),
                  "embed code"
                )
              }
            >
              Copy embed code
            </button>
          )}
        </div>
      </div>

      <p id={`${id}-hint`} className="share-toolbar__hint">
        {hint}
        {publicUrl ? " Embed code shows your image with its alt text and a link to this page; replace YOUR_IMAGE_URL with where the image is hosted." : ""}
      </p>

      {publicUrl && (
        <details className="share-toolbar__qr">
          <summary>QR code for this page</summary>
          <QRCodeGenerator permalink={publicUrl} />
        </details>
      )}

      <p className="share-toolbar__status" role="status" aria-live="polite">
        {status}
      </p>
    </section>
  );
}
