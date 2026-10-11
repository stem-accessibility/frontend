// src/pages/DiagramUploadPage.tsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import dagre from "dagre";
import { apiFetch, apiUpload } from "../lib/api";
import type { FlowchartData, NodeData, EdgeData } from "../types/types";
import "../pages/styles/DiagramUpload.css";
import UploadJobStatus from "../components/upload/UploadJobStatus";
import { logResearchEvent } from "../lib/logResearchEvent";

type UploadMode = "image" | "mermaid" | "scratch" | "existing";

type ParsedGraph = {
  nodes: Array<{ id: string; label: string }>;
  edges: Array<{ source: string; destination: string; label?: string }>;
};

type CreateFlowchartResponse = {
  flowchart_id: string;
  title?: string | null;
  short_alt?: string | null;
  summary?: string | null;
  image_mime?: string | null;
  image_endpoint?: string | null;
};

const NODE_W = 180;
const NODE_H = 60;

function layoutWithDagre(parsed: ParsedGraph): FlowchartData {
  const g = new dagre.graphlib.Graph({ multigraph: true });
  g.setGraph({ rankdir: "TB", nodesep: 40, ranksep: 60, marginx: 20, marginy: 20 });
  g.setDefaultEdgeLabel(() => ({}));

  parsed.nodes.forEach((n) => g.setNode(n.id, { width: NODE_W, height: NODE_H, label: n.label }));
  parsed.edges.forEach((e, i) => g.setEdge(e.source, e.destination, { label: e.label ?? "" }, `e${i}`));
  dagre.layout(g);

  const nodes: NodeData[] = parsed.nodes.map((n) => {
    const pos = g.node(n.id);
    const w = pos?.width ?? NODE_W;
    const h = pos?.height ?? NODE_H;

    const x1 = (pos?.x ?? 0) - w / 2;
    const y1 = (pos?.y ?? 0) - h / 2;

    return {
      id: n.id,
      label: n.label,
      shape: "rectangle",
      coordinates: [[x1, y1], [x1 + w, y1 + h]],
    };
  });

  const edges: EdgeData[] = parsed.edges.map((e, i) => ({
    id: `edge-${i}`,
    source: e.source,
    destination: e.destination,
    label: e.label,
    type: "solid",
    markerEnd: { type: "arrowclosed" },
  }));

  return { nodes, edges };
}

function clearLatestDiagramCache() {
  localStorage.removeItem("latestDiagramJSON");
  localStorage.removeItem("latestMermaidCode");
  localStorage.removeItem("latestDiagramImage");
  localStorage.removeItem("latestSummary");
  localStorage.removeItem("latestDiagramImageMime");
  localStorage.removeItem("latestTitle");
  localStorage.removeItem("latestShortAlt");
  localStorage.removeItem("editorMode");
  localStorage.removeItem("activeFlowchartId");
}

function ModeTab({
  id,
  label,
  active,
  disabled,
  onClick,
}: {
  id: string;
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      id={`tab-${id}`}
      aria-selected={active}
      aria-controls={`panel-${id}`}
      className={active ? "mode-tab mode-tab--active" : "mode-tab"}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export default function DiagramUploadPage() {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL as string;

  const [mode, setMode] = useState<UploadMode>("image");

  // image
  const [file, setFile] = useState<File | null>(null);
  const [diagramType, setDiagramType] = useState("Flow chart");

  // mermaid
  const [mermaidText, setMermaidText] = useState<string>(
    `flowchart TD
A[Start] --> B{Decision}
B -- Yes --> C[Do thing]
B -- No --> D[Do other thing]`
  );

  // existing
  const [existingId, setExistingId] = useState("");
  const [existingError, setExistingError] = useState("");

  const [busy, setBusy] = useState(false);
const [status, setStatus] = useState<string>("");
const [uploadJobId, setUploadJobId] = useState<number | null>(null);
const [statusIsError, setStatusIsError] = useState(false);


  const title = useMemo(() => {
    switch (mode) {
      case "image":
        return "Upload an image";
      case "mermaid":
        return "Paste Mermaid";
      case "scratch":
        return "Start from scratch";
      case "existing":
        return "Open existing";
    }
  }, [mode]);

  const switchMode = (m: UploadMode) => {
    setMode(m);
    setStatus("");
    setExistingError("");
    setUploadJobId(null);
    setStatusIsError(false);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);if (f) {
    logResearchEvent({
      event_type: "Upload_Image",
      editor_mode: "image",
      success: true,
      event_data: {
        source_page: "DiagramUploadPage",
        file_name: f.name,
        file_type: f.type,
        file_size_bytes: f.size,
      },
    });
  }
};
  async function createInitialFlowchart(params: {
  jsonData: FlowchartData;
  imageDataUrl?: string | null;
  imageMime?: string | null;
  title?: string | null;
}): Promise<CreateFlowchartResponse> {
  return apiFetch<CreateFlowchartResponse>("/flowcharts", {
    method: "POST",
    json: {
      json_data: params.jsonData,
      image_data_url: params.imageDataUrl,
      image_mime: params.imageMime,
      title: params.title ?? null,
    },
  });
}

  async function handleOpenExisting() {
    const id = existingId.trim();
    if (!id) return;

    setBusy(true);
    setExistingError("");
    setStatus("Loading flowchart…");

    try {
      const res = await fetch(`${API_URL}/get/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error(await res.text());

      const payload = await res.json();

      clearLatestDiagramCache();

      localStorage.setItem("activeFlowchartId", payload.flowchart_id);
      localStorage.setItem("latestDiagramJSON", JSON.stringify(payload.json_data));
      localStorage.setItem("latestSummary", payload.summary ?? "");
      localStorage.setItem("latestMermaidCode", "");
      localStorage.setItem("latestTitle", payload.title ?? "");
      localStorage.setItem("latestShortAlt", payload.short_alt ?? "");      

      if (payload.image_mime) localStorage.setItem("latestDiagramImageMime", payload.image_mime);

      if (payload.image_endpoint) {
        const imgRes = await fetch(`${API_URL}${payload.image_endpoint}`);
        if (imgRes.ok) {
          const imgPayload = await imgRes.json();
          if (imgPayload?.image_data_url) localStorage.setItem("latestDiagramImage", imgPayload.image_data_url);
          if (imgPayload?.image_mime) localStorage.setItem("latestDiagramImageMime", imgPayload.image_mime);
        }
      }

      localStorage.setItem("editorMode", "update");

      logResearchEvent({
        event_type: "Flowchart_Opened",
        editor_mode: "update",
        flowchart_id: payload.flowchart_id,
        success: true,
        event_data: {
          source_page: "DiagramUploadPage",
          opened_by_id: id,
          node_count: payload.json_data?.nodes?.length ?? 0,
          edge_count: payload.json_data?.edges?.length ?? 0,
        },
      });
      navigate("/editor");
    } catch (e) {
      setExistingError("Could not load that flowchart ID. Check the ID and try again.");
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  function handleCreateFromScratch() {
    clearLatestDiagramCache();
localStorage.setItem("latestTitle", "");
localStorage.setItem("latestShortAlt", "");
localStorage.setItem("latestSummary", "");
localStorage.setItem("editorMode", "create");
    logResearchEvent({
    event_type: "Create_Scratch",
    editor_mode: "scratch",
    success: true,
    event_data: {
      source_page: "DiagramUploadPage",
    },
  });
    navigate("/editor");
  }
  
  async function pollJobUntilComplete(jobId: number) {
  while (true) {
    const job = await apiFetch<{
      job_id: number;
      type: string;
      status: "queued" | "running" | "done" | "failed";
      result: {
        mermaid_json?: FlowchartData;
        mermaid_code?: string;
        image_data_url?: string;
        image_mime?: string;
        message?: string;
      } | null;
      error: string | null;
    }>(`/jobs/${jobId}`);

    if (job.status === "done") {
      return job.result;
    }

    if (job.status === "failed") {
      throw new Error(job.error || "Upload processing failed.");
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}


  async function handleGenerateFromImage() {
  if (!file) return;

  setBusy(true);
  setStatus("Uploading image…");
  setUploadJobId(null);
  setStatusIsError(false);

  const formData = new FormData();
  formData.append("file", file);
   
  let currentUploadJobId: number | null = null;

  try {
    const createJob = await apiUpload<{
      job_id: number;
      status: "queued" | "running" | "done" | "failed";
    }>("/jobs/process-upload", formData);
    currentUploadJobId = createJob.job_id;
    setUploadJobId(createJob.job_id);

    logResearchEvent({
        event_type: "Upload_Image",
        editor_mode: "image",
        success: true,
        event_data: {
          source_page: "DiagramUploadPage",
          file_name: file.name,
          file_type: file.type,
          file_size_bytes: file.size,
          upload_job_id:  currentUploadJobId,
        },
      });
    setStatus("Processing diagram…");

    const result = await pollJobUntilComplete(createJob.job_id);

    if (!result?.mermaid_json) {
      throw new Error("Failed to process diagram.");
    }

   

    setStatus("Saving initial upload…");

let imageDataUrl = result.image_data_url || null;

if (!imageDataUrl) {
  imageDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read uploaded image."));
    reader.readAsDataURL(file);
  });
}

const created = await createInitialFlowchart({
  jsonData: result.mermaid_json,
  imageDataUrl,
  imageMime: result.image_mime || "image/png",
  title: file.name,
});
logResearchEvent({
  event_type: "Create_Image",
  editor_mode: "image",
  flowchart_id: created.flowchart_id,
  success: true,
  event_data: {
    source_page: "DiagramUploadPage",
    file_name: file.name,
    file_type: file.type,
    file_size_bytes: file.size,
    node_count: result.mermaid_json.nodes.length,
    edge_count: result.mermaid_json.edges.length,
    upload_job_id: createJob.job_id,
  },
});
 setStatus("Preparing editor…");
clearLatestDiagramCache();

localStorage.setItem("activeFlowchartId", created.flowchart_id);
localStorage.setItem("latestDiagramJSON", JSON.stringify(result.mermaid_json));
localStorage.setItem("latestMermaidCode", result.mermaid_code || "");
localStorage.setItem("latestSummary", created.summary ?? "");
localStorage.setItem("latestTitle", created.title ?? file.name ?? "");
localStorage.setItem("latestShortAlt", created.short_alt ?? "");

if (result.image_mime) {
  localStorage.setItem("latestDiagramImageMime", result.image_mime);
}

if (imageDataUrl) {
  localStorage.setItem("latestDiagramImage", imageDataUrl);
}

localStorage.setItem("editorMode", "update");
navigate("/editor");
  } catch (e) {
    console.error(e);
    logResearchEvent({
    event_type: "Image_Processing_Failed",
    editor_mode: "image",
    success: false,
    event_data: {
      source_page: "DiagramUploadPage",
      file_name: file?.name,
      file_type: file?.type,
      file_size_bytes: file?.size,
      upload_job_id: uploadJobId,
      error_message: e instanceof Error ? e.message : String(e),
    },
  });

    setStatus("We couldn’t process that diagram. Please try again.");
    setStatusIsError(true);
  } finally {
    setBusy(false);
  }
}

  async function handleGenerateFromMermaid() {
    if (!mermaidText.trim()) return;

    logResearchEvent({
  event_type: "Upload_Mermaid",
  editor_mode: "mermaid",
  success: true,
  event_data: {
    source_page: "DiagramUploadPage",
    mermaid_char_count: mermaidText.length,
  },
});
    setBusy(true);
    setStatus("Generating diagram…");

    try {
      const res = await fetch(`${API_URL}/parse-mermaid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mermaid: mermaidText }),
      });

      if (!res.ok) throw new Error(await res.text());

      const parsed: ParsedGraph = await res.json();
      const flowchartData: FlowchartData = layoutWithDagre(parsed);

      logResearchEvent({
  event_type: "Create_Mermaid",
  editor_mode: "mermaid",
  success: true,
  event_data: {
    source_page: "DiagramUploadPage",
    node_count: flowchartData.nodes.length,
    edge_count: flowchartData.edges.length,
    mermaid_char_count: mermaidText.length,
  },
});

      clearLatestDiagramCache();
localStorage.setItem("latestDiagramJSON", JSON.stringify(flowchartData));
localStorage.setItem("latestMermaidCode", mermaidText);
localStorage.setItem("latestTitle", "");
localStorage.setItem("latestShortAlt", "");
localStorage.setItem("latestSummary", "");
localStorage.setItem("editorMode", "edit");

      navigate("/editor");
    } catch (e) {
      setStatus("Failed to generate diagram from Mermaid.");
      logResearchEvent({  event_type: "Mermaid_Parse_Failed",  editor_mode: "mermaid",  success: false,  event_data: {    source_page: "DiagramUploadPage",    mermaid_char_count: mermaidText.length,    error_message: e instanceof Error ? e.message : String(e),  },});

    } finally {
      setBusy(false);
    }
  }

  const primaryAction = (() => {
    switch (mode) {
      case "image":
        return (
          <>
            <label className="field">
              <span className="label">Diagram type</span>
              <select disabled className="select" value={diagramType} onChange={(e) => setDiagramType(e.target.value)}>
                <option>Flow chart</option>
              </select>
            </label>

            <button className="btn" type="button" onClick={handleGenerateFromImage} disabled={!file || busy}>
              {busy ? "Processing…" : "Generate diagram"}
            </button>
          </>
        );
      case "mermaid":
        return (
          <button className="btn" type="button" onClick={handleGenerateFromMermaid} disabled={!mermaidText.trim() || busy}>
            {busy ? "Generating…" : "Generate from Mermaid"}
          </button>
        );
      case "scratch":
        return (
          <button className="btn" type="button" onClick={handleCreateFromScratch} disabled={busy}>
            Open blank editor
          </button>
        );
      case "existing":
        return (
          <button className="btn" type="button" onClick={handleOpenExisting} disabled={!existingId.trim() || busy}>
            {busy ? "Loading…" : "Load flowchart"}
          </button>
        );
    }
  })();

  return (
    <div className="upload-page">
      <div className="upload-shell container">
        <header className="upload-header">
          <h1 className="upload-title">Upload</h1>
          <p className="upload-subtitle">Choose an input method to create or edit a flowchart in STEM-Accessibility.</p>
        </header>
        
           
          

        <div className="upload-card">
          <div className="upload-tabs" role="tablist" aria-label="Upload mode">
            <ModeTab id="image" label="Image" active={mode === "image"} disabled={busy} onClick={() => switchMode("image")} />
            <ModeTab id="mermaid" label="Mermaid" active={mode === "mermaid"} disabled={busy} onClick={() => switchMode("mermaid")} />
            <ModeTab id="scratch" label="Scratch" active={mode === "scratch"} disabled={busy} onClick={() => switchMode("scratch")} />
          </div>

          {(mode === "image" || mode === "scratch") && (
    <section
      className="editor-access-note editor-access-note--inline"
      aria-labelledby="editor-access-note-heading"
    >
      <div className="editor-access-note__content">
        <h2 id="editor-access-note-heading" className="editor-access-note__title">
          Better for screen reader users
        </h2>
        <p className="editor-access-note__text">
          The visual drag-and-drop editor is still improving for nonvisual use. For a more reliable text-based workflow, use Mermaid mode.
        </p>

        <div className="editor-access-note__actions">
          <a
            href="https://mermaid.js.org/syntax/flowchart.html"
            target="_blank"
            rel="noopener noreferrer"
            className="editor-access-note__link-btn"
          >
            Learn Mermaid syntax
          </a>

          <button
            type="button"
            className="editor-access-note__action"
            onClick={() => switchMode("mermaid")}
          >
            Use Mermaid instead
          </button>
        </div>
      </div>
    </section>
  )}

          <div className="upload-grid">
            {/* LEFT: panel */}
            <section
              className="upload-panel"
              id={`panel-${mode}`}
              role="tabpanel"
              aria-labelledby={`tab-${mode}`}
            >
              <h2 className="upload-panel-title">{title}</h2>

              {mode === "image" && (
                <div className="stack">
                  <label className="field">
                    <span className="label">Choose an image file</span>
                    <input className="input" type="file" accept="image/*" onChange={onFileChange} />
                  </label>

                  {file && (
                    <p className="upload-help" aria-live="polite">
                      Selected: <strong>{file.name}</strong>
                    </p>
                  )}
                </div>
              )}

              {mode === "mermaid" && (
                <div className="stack">
                  <label className="field">
                    <span className="label">Mermaid code</span>
                    <textarea
                      className="textarea upload-code"
                      value={mermaidText}
                      onChange={(e) => setMermaidText(e.target.value)}
                      rows={14}
                      spellCheck={false}
                      placeholder="flowchart TD ..."
                    />
                  </label>
                </div>
              )}

              {mode === "scratch" && (
                <div className="stack">
                  <p className="upload-help">You’ll start with a blank canvas in the editor.</p>
                </div>
              )}

              {mode === "existing" && (
                <div className="stack">
                  <p className="upload-help">Enter a Flowchart ID to load it into the editor and update the saved record.</p>

                  <label className="field">
                    <span className="label">Flowchart ID</span>
                    <input
                      className="input"
                      type="text"
                      value={existingId}
                      onChange={(e) => setExistingId(e.target.value)}
                      placeholder="e.g., UUID or saved ID"
                      aria-invalid={existingError ? "true" : "false"}
                      aria-describedby={existingError ? "existing-error" : undefined}
                    />
                  </label>

                  {existingError && (
                    <div id="existing-error" className="upload-error" role="alert">
                      {existingError}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* RIGHT: action */}
            <aside className="upload-actions" aria-label="Actions">
              <div className="upload-actions__inner">
                {primaryAction}

                <UploadJobStatus
                  busy={busy}
                  status={status}
                  jobId={uploadJobId}
                  error={statusIsError}
                />
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
