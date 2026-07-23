import { useAuthStore } from "@/shared/auth";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

export type OtpAmac = "GIRIS" | "KAYIT";

export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  rol: string | null;
  permissions: string[];
  oturum_tipi: string;
  sifre_degistirmeli_mi: boolean;
  kvkk_onaylandi_mi: boolean;
};

export type MeResponse = {
  id: number;
  email: string | null;
  ad: string;
  soyad: string;
  rol: string;
  aktif_mi: boolean;
  kullanici_adi: string | null;
  sifre_degistirmeli_mi: boolean;
  kvkk_onaylandi_mi: boolean;
};

async function parseError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { detail?: string | { msg?: string }[] };
    if (typeof body.detail === "string") return body.detail;
    if (Array.isArray(body.detail) && body.detail[0]?.msg) {
      return body.detail[0].msg;
    }
  } catch {
    /* ignore */
  }
  return `İstek başarısız (${res.status})`;
}

export async function otpGonder(input: {
  telefon: string;
  tc_kimlik_no: string;
  amac: OtpAmac;
}): Promise<{ mesaj: string; son_kullanma_saniye: number }> {
  const res = await fetch(`${API_URL}/auth/otp/gonder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function otpDogrula(input: {
  telefon: string;
  tc_kimlik_no: string;
  kod: string;
  amac: OtpAmac;
  ad?: string;
  soyad?: string;
  kvkk_onay?: boolean;
}): Promise<TokenResponse> {
  const res = await fetch(`${API_URL}/auth/otp/dogrula`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

async function refreshAccessToken(): Promise<boolean> {
  const { refreshToken, setAuth, clearAuth, rol } = useAuthStore.getState();
  if (!refreshToken) {
    await clearAuth();
    return false;
  }
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!res.ok) {
    await clearAuth();
    return false;
  }
  const data = (await res.json()) as TokenResponse;
  await setAuth(
    data.access_token,
    data.refresh_token,
    data.rol ?? rol ?? "HASTA",
  );
  return true;
}

export async function logoutApi(): Promise<void> {
  const { token, refreshToken, clearAuth } = useAuthStore.getState();
  try {
    if (token && refreshToken) {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    }
  } finally {
    await clearAuth();
  }
}

export async function apiFetch(
  path: string,
  init?: RequestInit,
  retried = false,
): Promise<Response> {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });

  if (res.status === 401 && !retried) {
    const ok = await refreshAccessToken();
    if (ok) return apiFetch(path, init, true);
  }

  return res;
}

export async function fetchMe(): Promise<MeResponse> {
  const res = await apiFetch("/auth/me");
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export { API_URL };
