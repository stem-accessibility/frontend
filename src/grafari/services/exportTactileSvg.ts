export async function exportTactileSvg(params: {
  apiBaseUrl: string;
  spec: unknown;
  filename?: string;
  timeoutMs?: number;
}) {
  const { apiBaseUrl, spec, filename = "tactile-output.svg", timeoutMs = 60_000 } = params;

  const controller = new AbortController();
  const t = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${apiBaseUrl}/tactile-svg`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spec }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`tactile-svg failed (${res.status}). ${text || "No details."}`);
    }

    const svgText = await res.text();

    const blob = new Blob([svgText], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    return {
      svgText,
      width: res.headers.get("X-TVl-Width"),
      height: res.headers.get("X-TVl-Height"),
    };
  } catch (e: any) {
    if (e?.name === "AbortError") {
      throw new Error(`tactile-svg timed out after ${Math.round(timeoutMs / 1000)}s.`);
    }
    throw e;
  } finally {
    window.clearTimeout(t);
  }
}
