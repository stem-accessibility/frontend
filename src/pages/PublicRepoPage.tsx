import { useEffect, useMemo, useState } from "react";
import RepoFlowchartCard, { type RepoFlowchartRow } from "../components/dashboard/RepoFlowchartCard";
import { apiFetch } from "../lib/api";
import "./styles/PublicRepoPage.css";

type StatusKind = "idle" | "info" | "error";

function getErrorMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  return String(e);
}

export default function PublicRepoPage() {
  const [rows, setRows] = useState<RepoFlowchartRow[]>([]);
  const [status, setStatus] = useState("Loading…");
  const [statusKind, setStatusKind] = useState<StatusKind>("info");

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setStatusKind("info");
        setStatus("Loading…");

        // Public endpoint; should NOT require auth
        const data = await apiFetch<RepoFlowchartRow[]>("/repo", { method: "GET" });

        if (cancelled) return;
        setRows(data);
        setStatusKind("idle");
        setStatus(`Loaded ${data.length}`);
      } catch (e) {
        if (cancelled) return;
        setStatusKind("error");
        setStatus(getErrorMessage(e));
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const types = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => s.add((r.flowchart_type || "unknown").toLowerCase()));
    return ["all", ...Array.from(s).sort()];
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const title = (r.title || r.flowchart_id || "").toLowerCase();
      const summary = (r.summary || "").toLowerCase();
      const type = (r.flowchart_type || "unknown").toLowerCase();

      const matchesQuery = !q || title.includes(q) || summary.includes(q);
      const matchesType = typeFilter === "all" || type === typeFilter;

      return matchesQuery && matchesType;
    });
  }, [rows, query, typeFilter]);

  return (
    <main className="repo-page">
      <header className="repo-hero">
        <div className="repo-hero__inner">
          <h1 className="repo-hero__title">Public Diagram Repository</h1>
          <p className="repo-hero__subtitle">
            Browse published diagrams that creators opted into sharing as public examples.
          </p>

          <div className="repo-controls" role="region" aria-label="Repository filters">
            <label className="repo-controls__search">
              <span className="sr-only">Search</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search title or description…"
              />
            </label>

            <label className="repo-controls__select">
              <span className="sr-only">Filter by diagram type</span>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t === "all" ? "All types" : t}
                  </option>
                ))}
              </select>
            </label>

            <div
              className={`repo-status repo-status--${statusKind}`}
              aria-live="polite"
              aria-atomic="true"
            >
              {status}
            </div>
          </div>
        </div>
      </header>

      <section className="repo-grid" aria-label="Public flowcharts">
        {filtered.length === 0 ? (
          <div className="repo-empty">
            <div className="repo-empty__title">No results</div>
            <div className="repo-empty__body">Try a different search or type filter.</div>
          </div>
        ) : (
          filtered.map((r) => <RepoFlowchartCard key={r.flowchart_id} row={r} />)
        )}
      </section>
    </main>
  );
}