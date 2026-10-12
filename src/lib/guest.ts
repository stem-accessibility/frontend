/**
 * Try-it support: a visitor with no account is identified by a random token kept in this browser.
 * It lives in a first-party cookie (with localStorage as a fallback) and is sent to the backend as
 * X-Guest-Token. The backend stores only a hash, so the token is the only proof of ownership.
 */
const KEY = "stem_guest_token";
const MAX_AGE = 60 * 60 * 24 * 365;

const RAW_API_URL = import.meta.env.VITE_API_URL as string;
const API_URL = (RAW_API_URL || "").replace(/\/+$/, "");

function readCookie(): string | null {
  try {
    const m = document.cookie.split("; ").find((c) => c.startsWith(`${KEY}=`));
    return m ? decodeURIComponent(m.split("=")[1]) : null;
  } catch {
    return null;
  }
}

function readStorage(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function newToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function store(token: string) {
  try {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${KEY}=${encodeURIComponent(token)}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax${secure}`;
  } catch {
    /* cookies blocked; localStorage below */
  }
  try {
    localStorage.setItem(KEY, token);
  } catch {
    /* storage blocked: the token then lasts only for this page view */
  }
}

let memoryToken: string | null = null;

/** The existing token, or null when this browser has never tried it (does not create one). */
export function peekGuestToken(): string | null {
  return memoryToken ?? readCookie() ?? readStorage();
}

/** The token for this browser, created on first use. */
export function getGuestToken(): string {
  const existing = peekGuestToken();
  if (existing) return existing;
  const t = newToken();
  memoryToken = t;
  store(t);
  return t;
}

export function clearGuestToken() {
  memoryToken = null;
  try {
    document.cookie = `${KEY}=; Max-Age=0; Path=/; SameSite=Lax`;
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
}

/** JSON fetch for the guest endpoints (no login). */
export async function guestFetch<T = any>(
  path: string,
  options: RequestInit & { json?: unknown } = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "X-Guest-Token": getGuestToken(),
    ...(options.headers as Record<string, string> | undefined),
  };
  let body: BodyInit | undefined = options.body as any;
  if (options.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.json);
  }
  const res = await fetch(`${API_URL}${path}`, { ...options, headers, body });
  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  const payload: any = isJson ? await res.json().catch(() => null) : await res.text().catch(() => "");
  if (!res.ok) {
    const detail = typeof payload === "string" ? payload : payload?.error || JSON.stringify(payload);
    throw new Error(detail || `${res.status} ${res.statusText}`);
  }
  return payload as T;
}
