import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../../lib/api";
import { thumbCache } from "./thumbCache";

type Props = {
  flowchartId: string;
  hasImage: boolean;
  className?: string;
  rootMargin?: string;
};

export default function FlowchartThumbnail({
  flowchartId,
  hasImage,
  className,
  rootMargin = "250px",
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  const [src, setSrc] = useState<string | null>(() => {
    return thumbCache.has(flowchartId) ? (thumbCache.get(flowchartId) ?? null) : null;
  });

  const [loading, setLoading] = useState(false);

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
          const img = await apiFetch<{ image_data_url?: string | null }>(
            `/get/${encodeURIComponent(flowchartId)}/image`
          );

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
    !hasImage ? "thumbnail--empty" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={ref}
      className={containerClasses}
      aria-busy={loading ? "true" : undefined}
      aria-label={hasImage ? undefined : "No preview available"}
    >
      {!hasImage ? (
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
