import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { diagramTypeLabel, normalizeDiagramType, DIAGRAM_TYPES } from "../arboretum/diagramTypes";
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
    const present = new Set(rows.map((r) => normalizeDiagramType(r.flowchart_type)));
    return ["all", ...DIAGRAM_TYPES.map((t) => t.value).filter((v) => present.has(v))];
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const type = normalizeDiagramType(r.flowchart_type);
      const haystack = [r.title || "", r.summary || "", r.short_alt || "", diagramTypeLabel(type)]
        .join(" ")
        .toLowerCase();
      const matchesQuery = !q || haystack.includes(q);
      const matchesType = typeFilter === "all" || type === typeFilter;
      return matchesQuery && matchesType;
    });
  }, [rows, query, typeFilter]);

  const loaded = statusKind === "idle";
  const hasFilters = query.trim() !== "" || typeFilter !== "all";
  const countText = loaded
    ? `Showing ${filtered.length} of ${rows.length} STEM ${rows.length === 1 ? "image" : "images"}`
    : status;

  return (
    <main className="repo-page">
      <header className="repo-hero">
        <div className="repo-hero__inner">
          <h1 className="repo-hero__title">Public STEM images</h1>
          <p className="repo-hero__subtitle">
            Browse STEM images that their creators chose to share publicly.
          </p>

          <div className="repo-controls" role="region" aria-label="Repository filters">
            <label className="repo-controls__search">
              <span className="sr-only">Search</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search title, description, or type…"
              />
            </label>

            <label className="repo-controls__select">
              <span className="sr-only">Filter by image type</span>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t === "all" ? "All types" : diagramTypeLabel(normalizeDiagramType(t))}
                  </option>
                ))}
              </select>
            </label>

            <div
              className={`repo-status repo-status--${statusKind}`}
              aria-live="polite"
              aria-atomic="true"
            >
              {countText}
            </div>
          </div>
        </div>
      </header>

      <section className="repo-grid" aria-label="Public STEM images">
        {filtered.length === 0 ? (
          loaded && rows.length === 0 ? (
            <div className="repo-empty">
              <div className="repo-empty__title">Nobody has shared a STEM image yet</div>
              <div className="repo-empty__body">
                <Link to="/create">Create one</Link>, or <Link to="/about">learn how it works</Link>.
              </div>
            </div>
          ) : (
            <div className="repo-empty">
              <div className="repo-empty__title">
                {query.trim() ? `No matches for “${query.trim()}”` : "No matches"}
              </div>
              <div className="repo-empty__body">
                Try a different search or type.{" "}
                {hasFilters && (
                  <button
                    type="button"
                    className="action action--ghost"
                    onClick={() => {
                      setQuery("");
                      setTypeFilter("all");
                    }}
                  >
                    Clear search and filters
                  </button>
                )}
              </div>
            </div>
          )
        ) : (
          filtered.map((r) => <RepoFlowchartCard key={r.flowchart_id} row={r} />)
        )}
      </section>
    </main>
  );
}