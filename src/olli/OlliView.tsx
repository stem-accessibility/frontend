// Mounts an Olli accessible tree view (https://github.com/umwelt-data/olli) of a chart into a
// React tree. Olli is imperative: it renders into a container element and returns a handle that
// must be destroyed. This is the only file that imports from "olli", so the dependency lives in
// one place.
import { useEffect, useRef } from "react";
import { olliVis } from "olli";
import type { OlliVisSpec } from "olli";
import "olli/styles.css";
import "./olli.css";

type Props = { spec: OlliVisSpec; label: string };

export default function OlliView({ spec, label }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handle = olliVis(spec, el);
    // Olli leaves the tree element unnamed; give it the same name as the region.
    const tree = el.querySelector('[role="tree"]');
    if (tree && !tree.hasAttribute("aria-label") && !tree.hasAttribute("aria-labelledby")) {
      tree.setAttribute("aria-label", label);
    }
    return () => handle.destroy();
  }, [spec, label]);

  return <div ref={containerRef} role="region" aria-label={label} />;
}
