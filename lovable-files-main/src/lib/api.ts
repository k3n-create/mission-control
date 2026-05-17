import { supabase } from "./supabase";

const FALLBACK_API_URL = "https://delivery-api-service.up.railway.app";

export const API_URL = (
  (import.meta.env.VITE_API_URL as string | undefined) ?? FALLBACK_API_URL
).replace(/\/$/, "");

export async function getClientId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const clientId = data.session?.user?.id;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) ?? {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (clientId) headers["X-Client-Id"] = clientId;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try { body = JSON.parse(text); } catch { body = text; }
  }
  if (!res.ok) {
    const msg =
      (body && typeof body === "object" && "error" in body && (body as { error?: string }).error) ||
      (typeof body === "string" ? body : `Request failed (${res.status})`);
    throw new Error(String(msg));
  }
  return body as T;
}
