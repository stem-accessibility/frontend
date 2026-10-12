import { useEffect, useRef, useState } from "react";
import { apiFetch, publicFetch } from "../../lib/api";
import { thumbCache, graphCache } from "./thumbCache";
import GraphSketch from "./GraphSketch";
import type { FlowchartData } from "../../types/types";

type Props = {
  flowchartId: string;
  /** For public listings: load through the public page endpoints (no login needed). */
  publicSlug?: string | null;
  hasImage: boolean;
  className?: string;
  rootMargin?: string;
};

export default function FlowchartThumbnail({
  flowchartId: ownId,
  publicSlug,
  hasImage,
  className,
  rootMargin = "250px",
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  // Cache key and fetch route: public listings use the slug endpoints.
  const flowchartId = publicSlug ? `p:${publicSlug}` : ownId;
  const get = publicSlug ? publicFetch : apiFetch;
  const base = publicSlug ? `/p/${encodeURIComponent(publicSlug)}` : `/get/${encodeURIComponent(ownId)}`;

  const [src, setSrc] = useState<string | null>(() => {
    return thumbCache.has(flowchartId) ? (thumbCache.get(flowchartId) ?? null) : null;
  });

  const [loading, setLoading] = useState(false);

  // No uploaded image (for example text-authored STEM images): sketch the graph instead.
  const [graph, setGraph] = useState<FlowchartData | null>(() =>
    graphCache.has(flowchartId) ? (graphCache.get(flowchartId) ?? null) : null
  );

  useEffect(() => {
    if (hasImage || graphCache.has(flowchartId)) return;
    const node = ref.current;
    if (!node) return;

    let cancelled = false;
    const observer = new IntersectionObserver(
      async (entries) => {
        if (!entries[0]?.isIntersecting) return;
        observer.disconnect();
        try {
          const fc = await get<{ json_data?: FlowchartData | string | null }>(base);
          const raw = fc?.json_data;
          const data = (typeof raw === "string" ? JSON.parse(raw) : raw) as FlowchartData | null;
          const ok = data && Array.isArray(data.nodes) && data.nodes.length > 0 ? data : null;
          graphCache.set(flowchartId, ok);
          if (!cancelled) setGraph(ok);
        } catch {
          graphCache.set(flowchartId, null);
        }
      },
      { root: null, rootMargin, threshold: 0.01 }
    );
    observer.observe(node);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [flowchartId, hasImage, rootMargin]);

  useEffect(() => {
    if (!hasImage) return;

    // If cached, no observer/fetch needed
    if (thumbCache.has(flowchartId)) return;

    const node = ref.current;
    if (!node) return;

    let cancelled = false;

    const observer = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;

        observer.disconnect();

        // Race-safe cache check
        if (thumbCache.has(flowchartId)) {
          if (!cancelled) setSrc(thumbCache.get(flowchartId) ?? null);
          return;
        }

        try {
          setLoading(true);
          const img = await get<{ image_data_url?: string | null }>(`${base}/image`);

          const url = img?.image_data_url ?? null;
          thumbCache.set(flowchartId, url);
          if (!cancelled) setSrc(url);
        } catch {
          thumbCache.set(flowchartId, null);
          if (!cancelled) setSrc(null);
        } finally {
          if (!cancelled) setLoading(false);
        }
      },
      { root: null, rootMargin, threshold: 0.01 }
    );

    observer.observe(node);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [flowchartId, hasImage, rootMargin]);

  const containerClasses = [
    "thumbnail",
    loading ? "thumbnail--loading" : "",
    !hasImage && !graph ? "thumbnail--empty" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={ref}
      className={containerClasses}
      aria-busy={loading ? "true" : undefined}
      aria-label={hasImage || graph ? undefined : "No preview available"}
    >
      {!hasImage && graph ? (
        <GraphSketch data={graph} />
      ) : !hasImage ? (
        <span className="thumbnail__label">No preview</span>
      ) : src ? (
        <img
          className="thumbnail__img"
          src={src}
          alt=""
          aria-hidden="true"
          loading="lazy"
        />
      ) : loading ? (
        <span className="thumbnail__label">Loading…</span>
      ) : (
        <span className="thumbnail__label">Preview unavailable</span>
      )}
    </div>
  );
}
