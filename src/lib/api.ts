import { supabase, DEV_AUTH } from "./supabaseClient";

const RAW_API_URL = import.meta.env.VITE_API_URL as string;

// normalize once (no trailing slash)
const API_URL = (RAW_API_URL || "").replace(/\/+$/, "");

type Json = Record<string, any>;

async function getAccessToken(): Promise<string | null> {
  if (DEV_AUTH) return "dev";
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function parseResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload: any = isJson
    ? await res.json().catch(() => null)
    : await res.text().catch(() => "");

  if (!res.ok) {
    const detail =
      typeof payload === "string"
        ? payload
        : payload?.error || payload?.detail || JSON.stringify(payload);
    throw new Error(`${res.status} ${res.statusText}: ${detail}`);
  }

  return payload as T;
}

/**
 * Public JSON fetch (no auth).
 */
export async function publicFetch<T = any>(
  path: string,
  options: RequestInit & { json?: Json } = {}
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  let body: BodyInit | undefined = options.body as any;

  if (options.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.json);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body,
  });

  return parseResponse<T>(res);
}

/**
 * Authenticated JSON fetch (requires Supabase session).
 */
export async function apiFetch<T = any>(
  path: string,
  options: RequestInit & { json?: Json } = {}
): Promise<T> {
  const token = await getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...(options.headers as Record<string, string> | undefined),
  };

  let body: BodyInit | undefined = options.body as any;

  if (options.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.json);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body,
  });

  return parseResponse<T>(res);
}

/**
 * Authenticated upload (FormData).
 * IMPORTANT: do not set Content-Type manually; browser sets it with boundary.
 */
export async function apiUpload<T = any>(
  path: string,
  formData: FormData,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...(options.headers as Record<string, string> | undefined),
  };

  // Ensure we DON'T carry over a JSON content-type accidentally.
  delete headers["Content-Type"];

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    method: options.method || "POST",
    headers,
    body: formData,
  });

  return parseResponse<T>(res);
}

/**
 * Public upload (FormData) — only if you need it.
 */
export async function publicUpload<T = any>(
  path: string,
  formData: FormData,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };
  delete headers["Content-Type"];

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    method: options.method || "POST",
    headers,
    body: formData,
  });

  return parseResponse<T>(res);
}

export { API_URL };