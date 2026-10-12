import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import FlowchartJsonViewer from "./FlowchartJsonViewer";
import type { PermalinkResponse } from "../../types/types";
import { apiFetch } from "../../lib/api";

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

const PermalinkJsonPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [data, setData] = useState<PermalinkResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        setError(null);
        const payload = await apiFetch<PermalinkResponse>(`/get/${encodeURIComponent(id)}`);
        if ((payload as any).error) throw new Error((payload as any).error);
        setData(payload);
      } catch (e: any) {
        console.error(e);
        setError(e?.message || "Failed to load STEM image JSON");
      }
    })();
  }, [id]);

  if (error) return <p>Error loading JSON: {error}</p>;
  if (!id || !data) return <p>Loading JSON...</p>;

  const origin = window.location.origin;
  const contentUrl = `${origin}/flowchart/${id}`;
  const jsonUrl = `${origin}/flowchart/${id}/json`;

  const jsonValue = safeParseJson(data.json_data);

  return (
    <FlowchartJsonViewer
      title="STEM image JSON"
      primaryIdLabel="STEM image ID"
      primaryIdValue={id}
      backLabel="Back to STEM image"
      backTo={`/flowchart/${id}`}
      jsonValue={jsonValue}
      defaultFileBase={`flowchart-${id}`}
      copyItems={[
        { label: "URL (no /json)", value: contentUrl },
        { label: "JSON URL", value: jsonUrl },
      ]}
    />
  );
};

export default PermalinkJsonPage;
