import React, { useMemo, useState } from "react";
import { exportTactileSvg } from "../services/exportTactileSvg";

type Props = {
  apiBaseUrl: string;
  spec: unknown | null;
  filename?: string;
  disabled?: boolean;
  onDone?: (svgText: string) => void;
};

const ExportTactileButton: React.FC<Props> = ({
  apiBaseUrl,
  spec,
  filename,
  disabled,
  onDone,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canExport = useMemo(() => {
    return !!spec && !disabled && !isExporting;
  }, [spec, disabled, isExporting]);

  async function onExport() {
    if (!spec) return;

    setIsExporting(true);
    setError(null);

    try {
      const result = await exportTactileSvg({
        apiBaseUrl,
        spec,
        filename: filename ?? "tactile-output.svg",
      });

      onDone?.(result.svgText);
    } catch (e: any) {
      setError(e?.message ?? "Failed to export tactile SVG.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <button onClick={onExport} disabled={!canExport}>
        {isExporting ? "Exporting…" : "Export tactile SVG"}
      </button>
      {error && <div style={{ color: "crimson", fontSize: 13 }}>{error}</div>}
    </div>
  );
};

export default ExportTactileButton;
