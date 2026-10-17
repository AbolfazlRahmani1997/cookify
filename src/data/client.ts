const TOKEN_KEY = "cookify.token";
const CHAT_JWT_KEY = "cookify.chatJwt";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore quota / private mode */
  }
}

export function getChatJwt(): string | null {
  try {
    return localStorage.getItem(CHAT_JWT_KEY);
  } catch {
    return null;
  }
}

export function setChatJwt(token: string | null) {
  try {
    if (token) localStorage.setItem(CHAT_JWT_KEY, token);
    else localStorage.removeItem(CHAT_JWT_KEY);
  } catch {
    /* ignore quota / private mode */
  }
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function apiBase(): string {
  const raw = import.meta.env.VITE_API_URL as string | undefined;
  return raw ? raw.replace(/\/$/, "") : "";
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${apiBase()}${path}`, { ...init, headers });
  let payload: { data?: T; error?: string } = {};
  try {
    payload = (await res.json()) as { data?: T; error?: string };
  } catch {
    payload = {};
  }
  if (!res.ok) {
    throw new ApiError(payload.error || "اتصال به سرور برقرار نشد.", res.status);
  }
  return payload.data as T;
}

export async function requestForm<T>(path: string, body: FormData): Promise<T> {
  const headers = new Headers();
  headers.set("Accept", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${apiBase()}${path}`, { method: "POST", headers, body });
  let payload: { data?: T; error?: string } = {};
  try {
    payload = (await res.json()) as { data?: T; error?: string };
  } catch {
    payload = {};
  }
  if (!res.ok) {
    throw new ApiError(payload.error || "اتصال به سرور برقرار نشد.", res.status);
  }
  return payload.data as T;
}
