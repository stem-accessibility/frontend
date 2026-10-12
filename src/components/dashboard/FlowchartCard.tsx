import { useId } from "react";
import { Link } from "react-router-dom";
import FlowchartThumbnail from "./FlowchartThumbnail";
import SharingControl from "../SharingControl";
import { normalizeSharing, type Sharing } from "../../lib/sharing";
import "../../components/dashboard/dashboard.css";

export type FlowchartRow = {
  flowchart_id: string;
  summary: string;
  has_image: boolean;
  title?: string | null;
  visibility?: "public" | "private";
  sharing?: Sharing;
  image_public?: boolean;
  image_mime?: string | null;
  created_at?: string | null;
  version?: number | null;
  is_published?: boolean;
  public_slug?: string | null;
  published_at?: string | null;
};

type Props = {
  row: FlowchartRow;
  
  onDelete: (flowchartId: string) => void;
  onSharingChange: (
    flowchartId: string,
    next: { sharing: Sharing; imagePublic: boolean }
  ) => Promise<void>;
};

function formatDate(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

export default function FlowchartCard({
  row: r,
  onDelete,
  onSharingChange,
}: Props) {
    const titleId = useId();


  const displayTitle =
  r.title && r.title.trim().length > 0 ? r.title : r.flowchart_id;

  const sharing = normalizeSharing(r.sharing ?? (r.is_published ? (r.visibility === "public" ? "public" : "link") : "private"));

  return (
    <article className="flowchart-card" aria-labelledby={titleId}>
      <FlowchartThumbnail
        flowchartId={r.flowchart_id}
        hasImage={r.has_image}
        className="flowchart-card__thumb"
      />

      <div className="flowchart-card__body">
        <div className="flowchart-card__header">
          <div className="flowchart-card__meta">
            <h2 className="flowchart-card__title" id={titleId}>
              {displayTitle}
            </h2>

            <div className="flowchart-card__chips">
              {r.version != null && <span className="flowchart-card__muted">v{r.version}</span>}
              {r.created_at && (
                <span className="flowchart-card__muted">Created {formatDate(r.created_at)}</span>
              )}
              {r.published_at && r.is_published && (
                <span className="flowchart-card__muted">Shared {formatDate(r.published_at)}</span>
              )}
            </div>

            <SharingControl
              compact
              hideLabel
              copyLabel="Copy permalink"
              openLabel="Open"
              sharing={sharing}
              imagePublic={!!r.image_public}
              hasImage={r.has_image}
              publicPath={r.is_published && r.public_slug ? `/p/${r.public_slug}` : null}
              onSave={(next) => onSharingChange(r.flowchart_id, next)}
            />
          </div>

          <div className="flowchart-card__actions" aria-label="STEM image actions">
  <Link className="action action--ghost" to={`/editor/${encodeURIComponent(r.flowchart_id)}`}>
    Edit
  </Link>

  <Link
    className="action action--ghost"
    to={
      r.is_published && r.public_slug
        ? `/p/${encodeURIComponent(r.public_slug)}`
        : `/flowchart/${encodeURIComponent(r.flowchart_id)}`
    }
  >
    Preview
  </Link>


  <button
    className="action action--danger"
    type="button"
    onClick={() => {
      const ok = window.confirm(
        `Delete this STEM image?\n\n${r.title?.trim() ? r.title : r.flowchart_id}\n\nThis cannot be undone.`
      );
      if (ok) onDelete(r.flowchart_id);
    }}
  >
    Delete
  </button>
</div>
        </div>

       
      </div>
    </article>
  );
}
