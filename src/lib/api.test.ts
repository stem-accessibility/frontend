import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./supabaseClient", () => ({ supabase: {}, DEV_AUTH: true }));

import { publicFetch } from "./api";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("publicFetch timeout", () => {
  it("rejects when the server never answers within timeoutMs", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
        })
      )
    );
    const result = publicFetch("/slow", { timeoutMs: 1000 });
    const settled = expect(result).rejects.toThrow("Aborted");
    await vi.advanceTimersByTimeAsync(1000);
    await settled;
  });

  it("returns the response when it arrives in time", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } }))
    );
    await expect(publicFetch("/fast", { timeoutMs: 1000 })).resolves.toEqual({ ok: true });
  });

  it("does not set a signal when no timeout is given", async () => {
    const f = vi.fn(async () => new Response("{}", { headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", f);
    await publicFetch("/plain");
    expect((f.mock.calls[0] as any)[1].signal).toBeUndefined();
  });
});
