import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { diagramTypeLabel, normalizeDiagramType, DIAGRAM_TYPES } from "../arboretum/diagramTypes";
import RepoFlowchartCard, { type RepoFlowchartRow } from "../components/dashboard/RepoFlowchartCard";
import { publicFetch } from "../lib/api";
import "./styles/PublicRepoPage.css";

type StatusKind = "idle" | "info" | "error";

/**
 * How long to wait for the list before giving up and offering "Try again". The backend can take
 * a while to answer the first request after it has been idle, so this is generous; without it a
 * stalled request left the page on "Loading…" forever.
 */
const REPO_LOAD_TIMEOUT_MS = 20_000;

function getErrorMessage(e: unknown) {
  if (e instanceof DOMException && e.name === "AbortError") {
    return "The server did not answer in time.";
  }
  if (e instanceof Error) return e.message;
  return String(e);
}

export default function PublicRepoPage() {
  const [rows, setRows] = useState<RepoFlowchartRow[]>([]);
  const [status, setStatus] = useState("Loading…");
  const [statusKind, setStatusKind] = useState<StatusKind>("info");
  // Bumped by "Try again" to run the request once more.
  const [attempt, setAttempt] = useState(0);
  // "Try again" disappears while the list reloads, so focus moves to the list instead of the page top.
  const gridRef = useRef<HTMLElement>(null);

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setStatusKind("info");
        setStatus("Loading…");

        // Public endpoint; should NOT require auth
        const data = await publicFetch<RepoFlowchartRow[]>("/repo", {
          method: "GET",
          timeoutMs: REPO_LOAD_TIMEOUT_MS,
        });

        if (cancelled) return;
        setRows(data);
        setStatusKind("idle");
        setStatus(`Loaded ${data.length}`);
      } catch (e) {
        if (cancelled) return;
        setStatusKind("error");
        setStatus(`Could not load public STEM images. ${getErrorMessage(e)}`);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

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

      <section
        ref={gridRef}
        tabIndex={-1}
        className="repo-grid"
        aria-label="Public STEM images"
        aria-busy={statusKind === "info"}
      >
        {statusKind === "info" ? (
          // The live region above already announces "Loading…"; this is only the visible placeholder.
          <div className="repo-empty">
            <div className="repo-empty__title">Loading public STEM images…</div>
          </div>
        ) : statusKind === "error" ? (
          // The live region above announces the error; this offers a way forward.
          <div className="repo-empty">
            <div className="repo-empty__title">Public STEM images could not be loaded</div>
            <div className="repo-empty__body">
              <button
                type="button"
                className="action action--ghost"
                onClick={() => {
                  gridRef.current?.focus();
                  setAttempt((n) => n + 1);
                }}
              >
                Try again
              </button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          loaded && rows.length === 0 ? (
            <div className="repo-empty">
              <div className="repo-empty__title">Nobody has shared a STEM image yet</div>
              <div className="repo-empty__body">
                <Link to="/try">Try it</Link> or <Link to="/create">create one</Link>, or <Link to="/about">learn how it works</Link>.
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