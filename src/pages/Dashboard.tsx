import { useEffect, useMemo, useState } from "react";
//import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import FlowchartCard, { type FlowchartRow } from "../components/dashboard/FlowchartCard";
import DashboardToolbar from "../components/dashboard/DashboardToolbar";
import "../pages/styles/Dashboard.css";
import ExportAccessibleRepsModal from "../components/access-reps/ExportAccessibleRepsModal";

import { logResearchEvent } from "../lib/logResearchEvent";
type StatusKind = "info" | "error";

function getErrorMessage(err: unknown) {
  if (typeof err === "object" && err && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return "Something went wrong.";
}



export default function Dashboard() {
  //const navigate = useNavigate();

  const [rows, setRows] = useState<FlowchartRow[]>([]);
  const [status, setStatus] = useState("Loading…");
  const [statusKind, setStatusKind] = useState<StatusKind>("info");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [_exportFlowchartId, setExportFlowchartId] = useState<string | null>(null);
const [exportFlowchart, setExportFlowchart] = useState<any | null>(null);
const [isExportOpen, setIsExportOpen] = useState(false);
const [isLoadingExport, setIsLoadingExport] = useState(false);

  // Fetch data
  useEffect(() => {
    (async () => {
      try {
        setStatusKind("info");
        setStatus("Loading…");
        const data = await apiFetch<FlowchartRow[]>("/flowcharts");
        setRows(data);
        setStatus(`Loaded ${data.length}`);
      } catch (e: unknown) {
        setStatusKind("error");
        setStatus(getErrorMessage(e));
      }
    })();
  }, []);

function parseFlowchartJsonData(value: unknown) {
  if (!value) return null;
  if (typeof value === "string") return JSON.parse(value);
  if (typeof value === "object") return value;
  return null;
}

const handleOpenExport = async (flowchartId: string) => {
  logResearchEvent({
  event_type: "Export_Clicked",
  editor_mode: "dashboard",
  flowchart_id: flowchartId,
  success: true,
  event_data: {
    source_page: "Dashboard",
    export_entry: "card_action",
  },
});
  setIsLoadingExport(true);
  setExportFlowchartId(flowchartId);
  setExportFlowchart(null);


  try {
    const fc = await apiFetch<{
      flowchart_id: string;
      json_data: string | Record<string, unknown> | null;
      summary: string;
      short_alt?: string | null;
      title?: string | null;
      is_published?: boolean;
      public_slug?: string | null;
      published_at?: string | null;
      visibility?: "public" | "private";
    }>(`/get/${encodeURIComponent(flowchartId)}`);

    setExportFlowchart({
      flowchart_id: fc.flowchart_id,
      json: parseFlowchartJsonData(fc.json_data),
      summary: fc.summary ?? "",
      shortAlt: fc.short_alt ?? "",
      title: fc.title ?? "",
      is_published: !!fc.is_published,
      public_slug: fc.public_slug ?? null,
      published_at: fc.published_at ?? null,
      visibility: fc.visibility ?? "private",
    });
    setIsExportOpen(true);

  } catch (error) {
    console.error("Failed to load flowchart for export:", error);
    setStatusKind("error");
    setStatus("Failed to load STEM image for export.");
  } finally {
    setIsLoadingExport(false);
  }
};
  // Filter
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((r) => {
      if (statusFilter === "published" && !r.is_published) return false;
      if (statusFilter === "draft" && r.is_published) return false;

      if (!q) return true;

      const hay = `${r.flowchart_id} ${r.title ?? ""} ${r.public_slug ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search, statusFilter]);

  // Pagination math
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const pageRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  // If filters change and current page is out of range, snap back
  useEffect(() => {
    if (page !== safePage) setPage(safePage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safePage]);

 

  async function onSetRepoVisibility(flowchartId: string, makePublic: boolean) {
  try {
    setStatusKind("info");
    setStatus("Updating repo visibility…");

    const visibility = makePublic ? "public" : "private";

    const updated = await apiFetch<{
      flowchart_id: string;
      visibility: "public" | "private";
    }>(`/research/${flowchartId}`, {
      method: "POST",
      json: { visibility },
    });

    setRows((prev) =>
      prev.map((r) =>
        r.flowchart_id === updated.flowchart_id
          ? { ...r, visibility: updated.visibility }
          : r
      )
    );
    setExportFlowchart((prev: any) =>
      prev && prev.flowchart_id === updated.flowchart_id
        ? { ...prev, visibility: updated.visibility }
        : prev
    );
    
    setStatus("Updated.");
    window.setTimeout(() => setStatus(`Loaded ${rows.length}`), 1200);
  } catch (e: unknown) {
    setStatusKind("error");
    setStatus(getErrorMessage(e));
  }
}


 const handleDelete = async (flowchartId: string) => {
  logResearchEvent({
    event_type: "Delete_Clicked",
    editor_mode: "dashboard",
    flowchart_id: flowchartId,
    success: true,
    event_data: {
      source_page: "Dashboard",
      target_type: "flowchart",
    },
  });

  const confirmed = window.confirm(
    "Delete this STEM image? This cannot be undone."
  );

  if (!confirmed) {
    logResearchEvent({
      event_type: "Delete_Cancelled",
      editor_mode: "dashboard",
      flowchart_id: flowchartId,
      success: true,
      event_data: {
        source_page: "Dashboard",
        target_type: "flowchart",
      },
    });
    return;
  }

  logResearchEvent({
    event_type: "Delete_Confirmed",
    editor_mode: "dashboard",
    flowchart_id: flowchartId,
    success: true,
    event_data: {
      source_page: "Dashboard",
      target_type: "flowchart",
    },
  });

  try {
    await apiFetch(`/flowcharts/${encodeURIComponent(flowchartId)}`, {
      method: "DELETE",
    });

    setRows((prev) => prev.filter((r) => r.flowchart_id !== flowchartId));

    logResearchEvent({
      event_type: "Delete_Succeeded",
      editor_mode: "dashboard",
      flowchart_id: flowchartId,
      success: true,
      event_data: {
        source_page: "Dashboard",
        target_type: "flowchart",
      },
    });

    logResearchEvent({
      event_type: "Flowchart_Deleted",
      editor_mode: "dashboard",
      flowchart_id: flowchartId,
      success: true,
      event_data: {
        source_page: "Dashboard",
      },
    });
  } catch (e) {
    logResearchEvent({
      event_type: "Validation_Error",
      editor_mode: "dashboard",
      flowchart_id: flowchartId,
      success: false,
      event_data: {
        source_page: "Dashboard",
        action: "delete",
        reason: getErrorMessage(e),
      },
    });

    throw e;
  }
};
  

  return (
    <div className="dashboard-container">
      <div className="dashboard-top">
        <div className="dashboard-header">
          <div className="dashboard-heading">
            <h1 className="dashboard-title">My STEM images</h1>

            <div
              className={`dashboard-status ${statusKind === "error" ? "dashboard-status--error" : ""}`}
              role={statusKind === "error" ? "alert" : "status"}
              aria-live={statusKind === "error" ? "assertive" : "polite"}
            >
              {status}
              {filtered.length !== rows.length ? ` • Showing ${filtered.length}` : ""}
            </div>
          </div>

          <div className="dashboard-controls">
            <label className="dashboard-pagesize" htmlFor="dashboard-page-size">
              Page size
            </label>
            <select
              id="dashboard-page-size"
              className="dashboard-select"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
            </select>
          </div>
        </div>

        <DashboardToolbar
          search={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
            logResearchEvent({
        event_type: "Dashboard_Search_Used",
        editor_mode: "dashboard",
        success: true,
        event_data: {
          source_page: "Dashboard",
          interaction: "search_used",
          query_length: v.length,
        },
      });
          }}
          statusFilter={statusFilter}
          onStatusFilterChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
         
        />
      </div>

      <div className="dashboard-grid" aria-label="STEM image list">
        {pageRows.map((r) => (
          <FlowchartCard
            key={r.flowchart_id}
            row={r}
            onOpenExport={handleOpenExport}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {isExportOpen && (
  exportFlowchart && exportFlowchart.json ? (
  <ExportAccessibleRepsModal
    isOpen={isExportOpen}
    onClose={() => {
      setIsExportOpen(false);
      setExportFlowchartId(null);
      setExportFlowchart(null);
    }}
    flowchartId={exportFlowchart.flowchart_id}
    json={exportFlowchart.json}
    title={exportFlowchart.title}
    shortAlt={exportFlowchart.shortAlt}
    summary={exportFlowchart.summary}
    imageUrl={
      exportFlowchart.flowchart_id
        ? `${window.location.origin}/get/${encodeURIComponent(exportFlowchart.flowchart_id)}/image`
        : null
    }
    isPublished={exportFlowchart.is_published}
    publicSlug={exportFlowchart.public_slug}
    repoVisibility={exportFlowchart.visibility ?? "private"}
    onSetRepoVisibility={(makePublic) =>
    onSetRepoVisibility(exportFlowchart.flowchart_id, makePublic)
  }
    isDirty={false}
    onRequestSave={() => {}}
    onPublishedChange={(next) => {
      setExportFlowchart((prev: any) =>
        prev
          ? {
              ...prev,
              is_published: next.is_published,
              public_slug: next.public_slug,
              published_at: next.published_at ?? null,
            }
          : prev
      );

      setRows((prevRows) =>
        prevRows.map((row) =>
          row.flowchart_id === exportFlowchart.flowchart_id
            ? {
                ...row,
                is_published: next.is_published,
                public_slug: next.public_slug,
                published_at: next.published_at ?? null,
              }
            : row
        )
      );
    }}
  /> ) : (
    <div className="modal-overlay" role="presentation">
      <div
        className="modal-card export-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-loading-title"
      >
        <div className="modal-header">
          <h2 id="export-loading-title" className="modal-title">
            Preparing exports…
          </h2>
          <button
            type="button"
            className="canvas-toolbar__btn"
            onClick={() => {
              setIsExportOpen(false);
              setExportFlowchartId(null);
              setExportFlowchart(null);
            }}
          >
            Close
          </button>
        </div>

        <div style={{ padding: 24 }}>
          {isLoadingExport ? "Loading STEM image details…" : "Unable to load export data."}
        </div>
      </div>
    </div>
  )
)}

      <nav className="dashboard-pagination" aria-label="Pagination">
        <div className="dashboard-pagination__meta">
          Page {safePage} of {totalPages}
        </div>

        <div className="dashboard-pagination-buttons">
          <button type="button" onClick={() => setPage(1)} disabled={safePage === 1}>
            First
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
          >
            Next
          </button>
          <button type="button" onClick={() => setPage(totalPages)} disabled={safePage === totalPages}>
            Last
          </button>
        </div>
      </nav>
    </div>
  );
}
