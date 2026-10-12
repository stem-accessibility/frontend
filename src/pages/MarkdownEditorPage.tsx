import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { FlowchartViewer } from "../components/ReactFlowViewer";
import { apiFetch } from "../lib/api";
import { logResearchEvent } from "../lib/logResearchEvent";
import { MARKDOWN_EXAMPLES, parseMermaidText } from "../lib/mermaidText";
import { clearLatestDiagramCache } from "../lib/editorCache";
import { autoDescribe, checkDiagramType } from "../arboretum/autoDescription";
import { diagramTypeLabel, normalizeDiagramType } from "../arboretum/diagramTypes";
import { SHARING_OPTIONS, normalizeSharing, type Sharing } from "../lib/sharing";
import {
  buildLongDescriptionMarkdown,
  createEmptyLongDescriptionSections,
} from "../services/longDescription";
import type { LongDescriptionSectionKey } from "../types/longDescription";
import "./styles/CreatePage.css";

type Settings = { title: string; type: string; sharing: Sharing };

function sectionsToMarkdown(sections: Record<LongDescriptionSectionKey, string>) {
  const empty = createEmptyLongDescriptionSections();
  (Object.keys(sections) as LongDescriptionSectionKey[]).forEach((k) => {
    empty[k] = { included: true, text: sections[k] ?? "" };
  });
  return buildLongDescriptionMarkdown(empty);
}

/** Debounce a value so the preview does not recompute on every keystroke. */
function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function MarkdownEditorPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const id = useId();
  const settings = location.state as Settings | null;

  const type = normalizeDiagramType(settings?.type);
  const sharing = normalizeSharing(settings?.sharing);
  const title = settings?.title ?? "";

  const [text, setText] = useState(MARKDOWN_EXAMPLES[type] ?? MARKDOWN_EXAMPLES.flowchart);
  const debounced = useDebounced(text, 250);
  const parsed = useMemo(() => parseMermaidText(debounced), [debounced]);
  const effectiveTitle = title || parsed.title;

  const generated = useMemo(
    () => (parsed.error ? null : autoDescribe(type, parsed.data, effectiveTitle)),
    [parsed, type, effectiveTitle]
  );
  const typeProblems = useMemo(
    () => (parsed.error ? [] : checkDiagramType(type, parsed.data)),
    [parsed, type]
  );

  // Alt text and long description follow the diagram until the author edits them.
  const [shortAlt, setShortAlt] = useState("");
  const [longDesc, setLongDesc] = useState("");
  const [altEdited, setAltEdited] = useState(false);
  const [descEdited, setDescEdited] = useState(false);

  useEffect(() => {
    if (!generated) return;
    if (!altEdited) setShortAlt(generated.shortAlt);
    if (!descEdited) setLongDesc(sectionsToMarkdown(generated.sections));
  }, [generated, altEdited, descEdited]);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const statusRef = useRef<HTMLParagraphElement | null>(null);

  if (!settings || !settings.title) return <Navigate to="/create" replace />;

  const nodeCount = parsed.data.nodes.length;
  const edgeCount = parsed.data.edges.length;
  const summaryLine = parsed.error
    ? ""
    : `${nodeCount} ${nodeCount === 1 ? "node" : "nodes"}, ${edgeCount} ${edgeCount === 1 ? "edge" : "edges"}`;

  async function save() {
    if (parsed.error || saving) return;
    setSaving(true);
    setSaveError("");
    try {
      const created = await apiFetch<{ flowchart_id: string }>("/flowcharts", {
        method: "POST",
        json: {
          json_data: parsed.data,
          summary: longDesc,
          short_alt: shortAlt,
          title: effectiveTitle,
          flowchart_type: type,
          sharing,
        },
      });
      logResearchEvent({
        event_type: "Create_Mermaid",
        editor_mode: "mermaid",
        flowchart_id: created.flowchart_id,
        success: true,
        event_data: {
          source_page: "MarkdownEditorPage",
          node_count: nodeCount,
          edge_count: edgeCount,
          mermaid_char_count: text.length,
          sharing,
          diagram_type: type,
          alt_edited: altEdited,
          description_edited: descEdited,
        },
      });
      clearLatestDiagramCache();
      try {
        localStorage.setItem("latestMermaidCode", text);
      } catch {
        /* optional convenience */
      }
      navigate(`/editor/${encodeURIComponent(created.flowchart_id)}`);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const sharingLabel = SHARING_OPTIONS.find((o) => o.value === sharing)?.label;
  const noteId = `${id}-note`;

  return (
    <div className="md-page">
      <div className="md-shell">
        <div className="md-head">
          <h1>Markdown editor</h1>
          <p className="md-meta">
            {title} · {diagramTypeLabel(type)} · {sharingLabel}
          </p>
        </div>

        <div className="md-grid">
          <div className="md-editor-col">
            <div className="md-section">
              <label htmlFor={`${id}-text`}>
                <h2>Markdown (Mermaid)</h2>
              </label>
              <textarea
                id={`${id}-text`}
                className="md-textarea"
                value={text}
                onChange={(e) => setText(e.target.value)}
                spellCheck={false}
                aria-describedby={`${id}-help`}
              />
              <p id={`${id}-help`} className="md-note">
                Write the STEM image as Mermaid text.{" "}
                <a
                  href="https://mermaid.js.org/syntax/flowchart.html"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Mermaid syntax<span className="sr-only"> (opens in a new tab)</span>
                </a>
                . Arrays use <code>block-beta</code>.
              </p>
            </div>

            <div className="md-actions">
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => setText(MARKDOWN_EXAMPLES[type] ?? MARKDOWN_EXAMPLES.flowchart)}
              >
                Insert {diagramTypeLabel(type).toLowerCase()} example
              </button>
            </div>

            {parsed.error && (
              <p className="create-error" role="alert">
                {parsed.error}
              </p>
            )}
            {parsed.warnings.length > 0 && (
              <ul className="md-warn" aria-label="Lines that could not be read">
                {parsed.warnings.slice(0, 5).map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="md-preview-col">
            <p ref={statusRef} className="md-note" role="status" aria-live="polite">
              {summaryLine}
            </p>

            <section className="md-section" aria-label="Preview of the image">
              <h2>Preview</h2>
              {parsed.error ? (
                <p className="md-note">Nothing to show yet.</p>
              ) : (
                <FlowchartViewer flowchartData={parsed.data} height={320} showMiniMap={false} />
              )}
              {typeProblems.length > 0 && (
                <div className="summary-warning" role="status">
                  <strong>This does not look like a {diagramTypeLabel(type).toLowerCase()}:</strong>
                  <ul>
                    {typeProblems.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            <p id={noteId} className="md-note">
              The alt text and long description are generated from the diagram and update as you
              change it. Once you edit one, it stops updating and is marked “Edited by you”. Use
              Regenerate to replace your edits with new text.
            </p>

            <div className="md-section">
              <label htmlFor={`${id}-alt`}>
                <h2>
                  Alt text
                  <span className="md-chip">{altEdited ? "Edited by you" : "Auto-generated"}</span>
                </h2>
              </label>
              <textarea
                id={`${id}-alt`}
                className="md-text"
                rows={3}
                value={shortAlt}
                aria-describedby={noteId}
                onChange={(e) => {
                  setShortAlt(e.target.value);
                  setAltEdited(true);
                }}
              />
              {altEdited && generated && (
                <div className="md-actions">
                  <button
                    type="button"
                    className="btn btn--outline"
                    onClick={() => {
                      setShortAlt(generated.shortAlt);
                      setAltEdited(false);
                    }}
                  >
                    Regenerate alt text (replaces your edits)
                  </button>
                </div>
              )}
            </div>

            <div className="md-section">
              <label htmlFor={`${id}-desc`}>
                <h2>
                  Long description
                  <span className="md-chip">{descEdited ? "Edited by you" : "Auto-generated"}</span>
                </h2>
              </label>
              <textarea
                id={`${id}-desc`}
                className="md-text"
                rows={10}
                value={longDesc}
                aria-describedby={noteId}
                onChange={(e) => {
                  setLongDesc(e.target.value);
                  setDescEdited(true);
                }}
              />
              {descEdited && generated && (
                <div className="md-actions">
                  <button
                    type="button"
                    className="btn btn--outline"
                    onClick={() => {
                      setLongDesc(sectionsToMarkdown(generated.sections));
                      setDescEdited(false);
                    }}
                  >
                    Regenerate long description (replaces your edits)
                  </button>
                </div>
              )}
            </div>

            <div className="md-actions">
              <button type="button" className="btn" disabled={!!parsed.error || saving} onClick={save}>
                {saving ? "Saving…" : "Save and continue"}
              </button>
              <button type="button" className="btn btn--outline" onClick={() => navigate("/create")}>
                Back
              </button>
            </div>
            {parsed.error && (
              <p className="create-why">Fix the text on the left to enable Save.</p>
            )}
            {saveError && (
              <p className="create-error" role="alert">
                {saveError}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
