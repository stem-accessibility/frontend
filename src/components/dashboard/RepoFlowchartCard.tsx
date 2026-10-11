import { useId } from "react";
import "./dashboard.css";
import FlowchartThumbnail from "./FlowchartThumbnail";

export type RepoFlowchartRow = {
  flowchart_id: string;
  title?: string | null;
  summary?: string | null;
  short_alt?: string | null;

  flowchart_type?: string | null;
  visibility?: "public" | "private" | string;

  has_image: boolean;
  image_endpoint?: string | null;

  is_published?: boolean;
  public_slug?: string | null;
  published_at?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function RepoFlowchartCard({ row: r }: { row: RepoFlowchartRow }) {
  const titleId = useId();

  const displayTitle = r.title && r.title.trim().length > 0 ? r.title : r.flowchart_id;

  const publicUrl =
    r.public_slug ? `${window.location.origin}/p/${encodeURIComponent(r.public_slug)}` : null;

  return (
    <article className="repo-card" aria-labelledby={titleId}>
         <FlowchartThumbnail
                flowchartId={r.flowchart_id}
                hasImage={r.has_image}
                
              />

      <div className="repo-card__body">
        <div className="repo-card__top">
          <h2 className="repo-card__title" id={titleId}>
            {displayTitle}
          </h2>

          <div className="repo-card__meta">
            <span className="repo-chip repo-chip--public" title="Visible in public repository">
              ✓ Public example
            </span>

           

            {r.published_at ? (
              <span className="repo-muted">Published {formatDate(r.published_at)}</span>
            ) : null}
          </div>
        </div>

        {r.short_alt ? (
          <p className="repo-card__summary">
            {r.short_alt}
          </p>
        ) : (
          <p className="repo-card__summary repo-card__summary--empty">No description provided.</p>
        )}

        <div className="repo-card__actions">
          {publicUrl ? (
            <>
              <a className="action action--primary"href={publicUrl} target="_blank" rel="noreferrer">
                Open
              </a>
              <button
                className="action action--ghost"
                type="button"
                onClick={() => navigator.clipboard.writeText(publicUrl)}
              >
                Copy link
              </button>
            </>
          ) : (
            <span className="repo-muted">No public link available.</span>
          )}
        </div>
      </div>
    </article>
  );
}