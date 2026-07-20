import { useAuthStore } from "@/shared/auth";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

export async function apiFetch(path: string, init?: RequestInit) {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  return fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });
}

export async function login(email: string, sifre: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, sifre }),
  });
  if (!res.ok) throw new Error("Giriş başarısız");
  return res.json() as Promise<{
    access_token: string;
    rol: string;
    refresh_token?: string;
  }>;
}
