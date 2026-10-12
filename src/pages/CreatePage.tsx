import { useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, apiUpload } from "../lib/api";
import type { FlowchartData } from "../types/types";
import UploadJobStatus from "../components/upload/UploadJobStatus";
import { logResearchEvent } from "../lib/logResearchEvent";
import {
  DIAGRAM_TYPES,
  normalizeDiagramType,
  supportsImageUpload,
} from "../arboretum/diagramTypes";
import type { DiagramType } from "../arboretum/diagramTypes";
import {
  DEFAULT_SHARING,
  IMAGE_SHARING_HELP,
  SHARING_OPTIONS,
  type Sharing,
} from "../lib/sharing";
import { clearLatestDiagramCache } from "../lib/editorCache";
import { MARKDOWN_EXAMPLES } from "../lib/mermaidText";
import "./styles/CreatePage.css";

type JobResult = {
  mermaid_json?: FlowchartData;
  mermaid_code?: string;
  image_data_url?: string;
  image_mime?: string;
} | null;

async function pollJobUntilComplete(jobId: number): Promise<JobResult> {
  for (;;) {
    const job = await apiFetch<{
      status: "queued" | "running" | "done" | "failed";
      result: JobResult;
      error: string | null;
    }>(`/jobs/${jobId}`);
    if (job.status === "done") return job.result;
    if (job.status === "failed") throw new Error(job.error || "Upload processing failed.");
    await new Promise((r) => setTimeout(r, 2000));
  }
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read uploaded image."));
    reader.readAsDataURL(file);
  });
}

export default function CreatePage() {
  const navigate = useNavigate();
  const id = useId();

  const [name, setName] = useState("");
  const [type, setType] = useState<DiagramType>("flowchart");
  const [sharing, setSharing] = useState<Sharing>(DEFAULT_SHARING);

  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [imagePublic, setImagePublic] = useState(false);

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [statusIsError, setStatusIsError] = useState(false);
  const [jobId, setJobId] = useState<number | null>(null);

  const hasName = name.trim().length > 0;
  const canUpload = supportsImageUpload(type);
  const whyId = `${id}-why`;

  function openMarkdown() {
    clearLatestDiagramCache();
    try {
      localStorage.setItem("latestTitle", name.trim());
      localStorage.setItem("latestShortAlt", "");
      localStorage.setItem("latestSummary", "");
      localStorage.setItem("editorMode", "mermaid");
      localStorage.setItem("pendingType", type);
      localStorage.setItem("pendingSharing", sharing);
      localStorage.setItem("pendingMarkdown", MARKDOWN_EXAMPLES[type] ?? MARKDOWN_EXAMPLES.flowchart);
    } catch {
      /* the editor still opens; it then starts from its defaults */
    }
    logResearchEvent({
      event_type: "Create_Mermaid",
      editor_mode: "mermaid",
      success: true,
      event_data: { source_page: "CreatePage", diagram_type: type, sharing },
    });
    navigate("/editor");
  }

  function openVisualEditor() {
    clearLatestDiagramCache();
    try {
      localStorage.setItem("latestTitle", name.trim());
      localStorage.setItem("latestShortAlt", "");
      localStorage.setItem("latestSummary", "");
      localStorage.setItem("editorMode", "create");
      localStorage.setItem("pendingType", type);
      localStorage.setItem("pendingSharing", sharing);
    } catch {
      /* the editor still opens; type and sharing then fall back to defaults */
    }
    logResearchEvent({
      event_type: "Create_Scratch",
      editor_mode: "scratch",
      success: true,
      event_data: { source_page: "CreatePage" },
    });
    navigate("/editor");
  }

  async function processImage() {
    if (!file || !hasName) return;
    setBusy(true);
    setStatusIsError(false);
    setStatus("Uploading image…");
    setJobId(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const job = await apiUpload<{ job_id: number }>("/jobs/process-upload", formData);
      setJobId(job.job_id);
      logResearchEvent({
        event_type: "Upload_Image",
        editor_mode: "image",
        success: true,
        event_data: {
          source_page: "CreatePage",
          file_name: file.name,
          file_type: file.type,
          file_size_bytes: file.size,
          upload_job_id: job.job_id,
        },
      });
      setStatus("Processing STEM image…");

      const result = await pollJobUntilComplete(job.job_id);
      if (!result?.mermaid_json) throw new Error("Failed to process STEM image.");

      setStatus("Saving…");
      const imageDataUrl = result.image_data_url || (await readAsDataUrl(file));
      const created = await apiFetch<{ flowchart_id: string }>("/flowcharts", {
        method: "POST",
        json: {
          json_data: result.mermaid_json,
          image_data_url: imageDataUrl,
          image_mime: result.image_mime || file.type || "image/png",
          title: name.trim(),
          flowchart_type: type,
          sharing,
          image_public: imagePublic,
        },
      });
      logResearchEvent({
        event_type: "Create_Image",
        editor_mode: "image",
        flowchart_id: created.flowchart_id,
        success: true,
        event_data: {
          source_page: "CreatePage",
          file_name: file.name,
          node_count: result.mermaid_json.nodes.length,
          edge_count: result.mermaid_json.edges.length,
          upload_job_id: job.job_id,
          sharing,
          diagram_type: type,
        },
      });

      clearLatestDiagramCache();
      navigate(`/editor/${encodeURIComponent(created.flowchart_id)}`);
    } catch (e) {
      console.error(e);
      logResearchEvent({
        event_type: "Image_Processing_Failed",
        editor_mode: "image",
        success: false,
        event_data: {
          source_page: "CreatePage",
          file_name: file.name,
          error_message: e instanceof Error ? e.message : String(e),
        },
      });
      setStatus("We couldn’t process that STEM image. Please try again.");
      setStatusIsError(true);
    } finally {
      setBusy(false);
    }
  }

  const sharesImage = sharing !== "private";

  return (
    <div className="create-page">
      <div className="create-shell">
        <h1 className="create-title">Create a STEM image</h1>
        <p className="create-subtitle">
          Name it, choose its type and who can see it, then upload an image or write it as text.
        </p>

        <form
          className="create-form"
          onSubmit={(e) => e.preventDefault()}
          aria-busy={busy}
        >
          <div className="create-field">
            <label className="create-label" htmlFor={`${id}-name`}>
              Name
            </label>
            <input
              id={`${id}-name`}
              className="create-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
              required
              aria-describedby={hasName ? undefined : whyId}
            />
          </div>

          <div className="create-field">
            <label className="create-label" htmlFor={`${id}-type`}>
              Image type
            </label>
            <select
              id={`${id}-type`}
              className="create-select"
              value={type}
              onChange={(e) => {
                const next = normalizeDiagramType(e.target.value);
                setType(next);
                if (!supportsImageUpload(next)) setShowUpload(false);
              }}
              aria-describedby={`${id}-type-hint`}
            >
              {DIAGRAM_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <p id={`${id}-type-hint`} className="create-hint">
              {DIAGRAM_TYPES.find((t) => t.value === type)?.hint}
            </p>
          </div>

          <fieldset className="create-fieldset">
            <legend>Who can see it</legend>
            {SHARING_OPTIONS.map((o) => (
              <label key={o.value} className="create-radio">
                <input
                  type="radio"
                  name={`${id}-sharing`}
                  value={o.value}
                  checked={sharing === o.value}
                  onChange={() => setSharing(o.value)}
                />
                <span className="create-radio__label">{o.label}</span>
                <span className="create-radio__help">{o.help}</span>
              </label>
            ))}
          </fieldset>

          <div className="create-actions" role="group" aria-label="How to start">
            <button
              type="button"
              className="btn"
              disabled={!hasName || !canUpload || busy}
              aria-describedby={!hasName ? whyId : !canUpload ? `${id}-noupload` : undefined}
              aria-expanded={showUpload}
              onClick={() => setShowUpload((v) => !v)}
            >
              Upload image
            </button>
            <button
              type="button"
              className="btn"
              disabled={!hasName || busy}
              aria-describedby={hasName ? undefined : whyId}
              onClick={openMarkdown}
            >
              Markdown editor
            </button>
            {type === "flowchart" && (
              <button
                type="button"
                className="btn btn--outline"
                disabled={!hasName || busy}
                aria-describedby={hasName ? undefined : whyId}
                onClick={openVisualEditor}
              >
                Visual editor
              </button>
            )}
          </div>
          {!hasName && (
            <p id={whyId} className="create-why">
              Enter a name to enable these buttons.
            </p>
          )}
          {!canUpload && (
            <p id={`${id}-noupload`} className="create-why">
              Uploading an image is available for flowcharts, trees, binary trees, and linked lists.
              {` ${DIAGRAM_TYPES.find((t) => t.value === type)?.label ?? "This type"}`} images are
              written as text: use the Markdown editor.
            </p>
          )}

          {showUpload && canUpload && (
            <section className="create-panel" aria-label="Upload an image">
              <div className="create-field">
                <label className="create-label" htmlFor={`${id}-file`}>
                  Image file
                </label>
                <input
                  id={`${id}-file`}
                  type="file"
                  accept="image/*"
                  disabled={busy}
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                {file && (
                  <p className="create-hint" aria-live="polite">
                    Selected: <strong>{file.name}</strong>
                  </p>
                )}
              </div>

              {sharesImage && (
                <label className="create-check">
                  <input
                    type="checkbox"
                    checked={imagePublic}
                    onChange={(e) => setImagePublic(e.target.checked)}
                    disabled={busy}
                  />
                  <span>
                    <strong>Show the source image on the shared page.</strong>
                    <span className="create-hint"> {IMAGE_SHARING_HELP}</span>
                  </span>
                </label>
              )}

              <div className="create-actions">
                <button
                  type="button"
                  className="btn"
                  disabled={!file || busy}
                  onClick={processImage}
                >
                  {busy ? "Processing…" : "Create from image"}
                </button>
              </div>
              {!file && !busy && <p className="create-why">Choose an image file to continue.</p>}

              <UploadJobStatus busy={busy} status={status} jobId={jobId} error={statusIsError} />
            </section>
          )}
        </form>
      </div>
    </div>
  );
}
