import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import QRCodeGenerator from './QRCode';
import type { PermalinkProps } from '../../types/types';
import { normalizeFlowchartJson } from '../../services/normalizeFlowchartJson';
import { apiFetch } from '../../lib/api';

type PublishResponse = {
  flowchart_id: string;
  is_published: boolean;
  public_slug: string | null;
  public_url: string | null;
};

const Permalink: React.FC<PermalinkProps> = ({ json, summary, flowchartId }) => {
  const [permalink, setPermalink] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // Keep the active id in state so it updates after CREATE
  const [activeId, setActiveId] = useState<string | null>(null);

  const cleaned = useMemo(() => normalizeFlowchartJson(json as any), [json]);

  // Resolve the ID once on mount (prop > localStorage)
  useEffect(() => {
    const ls = localStorage.getItem("activeFlowchartId");
    const fromLS = ls && ls !== "undefined" ? ls : null;
    setActiveId(flowchartId || fromLS);
  }, [flowchartId]);

  const publish = useCallback(async () => {

    if (isPublishing) return;
    if (!activeId) {
  setError("Save this flowchart first, then publish a permalink.");
  return;
}

    if (!json || !summary) {
      setError("Cannot generate permalink: Missing data.");
      return;
    }

    setIsPublishing(true);
    setError(null);

    const image_data_url = localStorage.getItem("latestDiagramImage") || null;
    const image_mime = localStorage.getItem("latestDiagramImageMime") || null;

    try {
      // 1) CREATE or UPDATE the flowchart record
      let id = activeId;

      if (id) {
        await apiFetch(`/flowcharts/${encodeURIComponent(id)}`, {
          method: "PUT",
          json: {
            json_data: cleaned,
            summary,
            image_data_url,
            image_mime,
          },
        });
      } else {
        const newId = uuidv4();

        const created = await apiFetch<{ flowchart_id: string }>(`/flowcharts`, {
          method: "POST",
          json: {
            flowchart_id: newId,
            json_data: cleaned,
            summary,
            image_data_url,
            image_mime,
          },
        });

        id = created.flowchart_id || newId;

        // Persist so next time you UPDATE
        localStorage.setItem("activeFlowchartId", id);
        setActiveId(id);
      }

      if (!id) throw new Error("No flowchart_id available after save.");

      // 2) Ensure permalink is published + get slug
      const pub = await apiFetch<PublishResponse>(`/publish/${encodeURIComponent(id)}`, {
        method: "POST",
        json: { publish: true },
      });

      if (!pub.public_slug) throw new Error("Publish succeeded but no public_slug returned.");

      // 3) Set the permalink to the PUBLIC slug route
      // If your frontend page is /p/:slug, do this:
      setPermalink(`${window.location.origin}/p/${pub.public_slug}`);
    } catch (err) {
      console.error("Permalink publish error:", err);
      setError(err instanceof Error ? err.message : "Error connecting to the server.");
    } finally {
      setIsPublishing(false);
    }
  }, [activeId, cleaned, json, summary]);

  

  return (
  <div>
    {error && <p style={{ color: "red" }}>{error}</p>}

    {permalink ? (
      <div>
        <a href={permalink} target="_blank" rel="noopener noreferrer">
          View Permalink
        </a>

        <div style={{ marginTop: 10 }}>
          <button onClick={publish} disabled={isPublishing}>
            {isPublishing ? "Updating..." : "Update Permalink"}
          </button>
        </div>
      </div>
    ) : (
      <div>
        <button onClick={publish} disabled={isPublishing}>
          {isPublishing ? "Publishing..." : "Publish permalink"}
        </button>
        {!error && (
          <p style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
            Publishing creates/updates the saved flowchart and generates a public link.
          </p>
        )}
      </div>
    )}

    <QRCodeGenerator permalink={permalink} />
  </div>
);
};

export default Permalink;