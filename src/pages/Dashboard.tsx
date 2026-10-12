import { useEffect, useMemo, useState } from "react";
//import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import FlowchartCard, { type FlowchartRow } from "../components/dashboard/FlowchartCard";
import DashboardToolbar from "../components/dashboard/DashboardToolbar";
import "../pages/styles/Dashboard.css";

import { logResearchEvent } from "../lib/logResearchEvent";
import type { Sharing } from "../lib/sharing";
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

 

  async function onSharingChange(
    flowchartId: string,
    next: { sharing: Sharing; imagePublic: boolean }
  ) {
    const updated = await apiFetch<{
      sharing: Sharing;
      image_public: boolean;
      visibility: "public" | "private";
      is_published: boolean;
      public_slug: string | null;
      published_at: string | null;
    }>(`/flowcharts/${encodeURIComponent(flowchartId)}/sharing`, {
      method: "PUT",
      json: { sharing: next.sharing, image_public: next.imagePublic },
    });
    setRows((prev) =>
      prev.map((r) => (r.flowchart_id === flowchartId ? { ...r, ...updated } : r))
    );
    logResearchEvent({
      event_type: updated.sharing === "private" ? "Unpublish_Succeeded" : "Publish_Succeeded",
      flowchart_id: flowchartId,
      success: true,
      event_data: {
        source_page: "Dashboard",
        sharing: updated.sharing,
        image_public: updated.image_public,
      },
    });
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
            onDelete={handleDelete}
            onSharingChange={onSharingChange}
          />
        ))}
      </div>
    </div>
  );
}
