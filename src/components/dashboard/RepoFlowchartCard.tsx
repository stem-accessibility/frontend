import { useId } from "react";
import "./dashboard.css";
import { Link } from "react-router-dom";
import FlowchartThumbnail from "./FlowchartThumbnail";

export type RepoFlowchartRow = {
  flowchart_id: string;
  title?: string | null;
  summary?: string | null;
  short_alt?: string | null;

  flowchart_type?: string | null;
  visibility?: "public" | "private" | string;

  has_image: boolean;
  guest?: boolean;
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

  const sharedPath = r.public_slug ? `/p/${encodeURIComponent(r.public_slug)}` : null;
  const publicUrl = sharedPath ? `${window.location.origin}${sharedPath}` : null;

  return (
    <article className="repo-card" aria-labelledby={titleId}>
         <FlowchartThumbnail
                flowchartId={r.flowchart_id}
                publicSlug={r.public_slug}
                hasImage={r.has_image}
                
              />

      <div className="repo-card__body">
        <div className="repo-card__top">
          <h2 className="repo-card__title" id={titleId}>
            {sharedPath ? (
              // The link's ::after covers the whole card, so the card is one click target
              // and one tab stop.
              <Link className="repo-card__link" to={sharedPath}>
                {displayTitle}
              </Link>
            ) : (
              displayTitle
            )}
          </h2>

          <div className="repo-card__meta">
            <span className="repo-chip repo-chip--public" title="Visible in public repository">
              ✓ Public example
            </span>
            {r.guest && (
              <span className="repo-chip" title="Made without an account">
                Guest
              </span>
            )}

           

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