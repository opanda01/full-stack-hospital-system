import { getApiUrl } from "@/shared/api/resolveApiUrl";
import {
  apiFetch,
  fetchMe,
  logoutApi,
  parseApiError,
  type MeResponse,
  type TokenResponse,
} from "@/shared/api/http";

export type OtpAmac = "GIRIS" | "KAYIT";

export type { MeResponse, TokenResponse };

export async function otpGonder(input: {
  telefon: string;
  tc_kimlik_no: string;
  amac: OtpAmac;
}): Promise<{
  mesaj: string;
  son_kullanma_saniye: number;
  gelistirme_kodu?: string | null;
}> {
  let res: Response;
  try {
    res = await fetch(`${getApiUrl()}/auth/otp/gonder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    throw new Error(
      `Sunucuya ulaşılamadı (${getApiUrl()}). Backend (docker compose up) çalışıyor mu? Aynı Wi‑Fi / emülatör ayarını kontrol edin.`,
    );
  }
  if (!res.ok) throw new Error(await parseApiError(res));
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
  let res: Response;
  try {
    res = await fetch(`${getApiUrl()}/auth/otp/dogrula`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    throw new Error(
      `Sunucuya ulaşılamadı (${getApiUrl()}). Backend çalışıyor mu?`,
    );
  }
  if (!res.ok) throw new Error(await parseApiError(res));
  return res.json();
}

export { apiFetch, fetchMe, logoutApi };
export { getApiUrl, resolveApiUrl } from "@/shared/api/resolveApiUrl";
export * from "@/shared/api/types";
export * from "@/shared/api/hastaApi";
