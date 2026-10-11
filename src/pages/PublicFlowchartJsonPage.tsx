import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import FlowchartJsonViewer from "../components/access-reps/FlowchartJsonViewer";

type PublicFlowchartResponse = {
  public_slug: string;
  flowchart_id?: string;
  json_data: any;
  summary: string;
  has_image: boolean;
  image_mime?: string | null;
  published_at?: string | null;
};

function safeParseJson(input: unknown): unknown {
  if (input == null) return null;
  if (typeof input === "string") {
    try {
      return JSON.parse(input);
    } catch {
      return input;
    }
  }
  return input;
}

const PublicFlowchartJsonPage: React.FC = () => {
  const { public_slug } = useParams<{ public_slug: string }>();
  const API_URL = import.meta.env.VITE_API_URL;

  const [data, setData] = useState<PublicFlowchartResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!public_slug) return;

    (async () => {
      try {
        setError(null);
        const res = await fetch(`${API_URL}/p/${encodeURIComponent(public_slug)}`);
        if (!res.ok) throw new Error("Flowchart not found");
        const payload: PublicFlowchartResponse = await res.json();
        if ((payload as any).error) throw new Error((payload as any).error);
        setData(payload);
      } catch (e: any) {
        console.error(e);
        setError(e?.message || "Failed to load published flowchart JSON");
      }
    })();
  }, [public_slug, API_URL]);

  if (error) return <p>Error loading JSON: {error}</p>;
  if (!public_slug || !data) return <p>Loading JSON...</p>;

  const origin = window.location.origin;
  const contentUrl = `${origin}/p/${public_slug}`;
  const jsonUrl = `${origin}/p/${public_slug}/json`;

  const jsonValue = safeParseJson(data.json_data);

  return (
  <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
        alignItems: "flex-end",
        marginBottom: 12,
      }}
    >
      <div>
        <h2 style={{ margin: 0 }}>Published Flowchart JSON</h2>
        <div style={{ marginTop: 6 }}>
          <Link to={`/p/${public_slug}`}>Back to published flowchart</Link>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <a href={contentUrl} target="_blank" rel="noreferrer">
          Open published page
        </a>
        <a href={jsonUrl} target="_blank" rel="noreferrer">
          Open JSON page
        </a>
      </div>
    </div>

    <FlowchartJsonViewer
      title="Published Flowchart JSON"
      primaryIdLabel="Public slug"
      primaryIdValue={public_slug}
      backLabel="Back to published flowchart"
      backTo={`/p/${public_slug}`}
      jsonValue={jsonValue}
      defaultFileBase={`published-flowchart-${public_slug}`}
      copyItems={[
        { label: "URL (no /json)", value: contentUrl },
        { label: "JSON URL", value: jsonUrl },
        ...(data.flowchart_id ? [{ label: "Private Flowchart ID", value: data.flowchart_id }] : []),
      ]}
    />
  </div>
);

};

export default PublicFlowchartJsonPage;
