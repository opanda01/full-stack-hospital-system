import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL ?? "/api";

/** Auth çağrıları için interceptor'sız client (refresh döngüsünü önlemek için). */
const authClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  rol: string;
  permissions?: string[];
  oturum_tipi?: string;
  sifre_degistirmeli_mi?: boolean;
  kvkk_onaylandi_mi?: boolean;
};

export type MeResponse = {
  id: number;
  email: string | null;
  ad: string;
  soyad: string;
  rol: string;
  aktif_mi: boolean;
  kullanici_adi?: string | null;
  sifre_degistirmeli_mi?: boolean;
  kvkk_onaylandi_mi?: boolean;
};

export async function login(kimlik: string, sifre: string): Promise<TokenResponse> {
  const { data } = await authClient.post<TokenResponse>("/auth/login", {
    kimlik,
    sifre,
  });
  return data;
}

export async function refresh(refreshToken: string): Promise<TokenResponse> {
  const { data } = await authClient.post<TokenResponse>("/auth/refresh", {
    refresh_token: refreshToken,
  });
  return data;
}

export async function logout(refreshToken: string): Promise<void> {
  const { useAuthStore } = await import("./authStore");
  const access = useAuthStore.getState().accessToken ?? useAuthStore.getState().token;
  await authClient.post(
    "/auth/logout",
    { refresh_token: refreshToken },
    access ? { headers: { Authorization: `Bearer ${access}` } } : undefined,
  );
}

export async function me(): Promise<MeResponse> {
  const { useAuthStore } = await import("./authStore");
  const access = useAuthStore.getState().accessToken ?? useAuthStore.getState().token;
  const { data } = await authClient.get<MeResponse>("/auth/me", {
    headers: access ? { Authorization: `Bearer ${access}` } : {},
  });
  return data;
}

export async function sifreDegistir(
  eski_sifre: string,
  yeni_sifre: string,
): Promise<void> {
  const { useAuthStore } = await import("./authStore");
  const access = useAuthStore.getState().accessToken ?? useAuthStore.getState().token;
  await authClient.post(
    "/auth/sifre-degistir",
    { eski_sifre, yeni_sifre },
    access ? { headers: { Authorization: `Bearer ${access}` } } : undefined,
  );
}

export async function kvkkOnay(onay = true): Promise<MeResponse> {
  const { useAuthStore } = await import("./authStore");
  const access = useAuthStore.getState().accessToken ?? useAuthStore.getState().token;
  const { data } = await authClient.post<MeResponse>(
    "/auth/kvkk-onay",
    { onay },
    access ? { headers: { Authorization: `Bearer ${access}` } } : undefined,
  );
  return data;
}

export type SifreSifirlaIstekResponse = {
  mesaj: string;
  son_kullanma_saniye: number;
};

export async function sifreSifirlaIstek(
  kimlik: string,
): Promise<SifreSifirlaIstekResponse> {
  const { data } = await authClient.post<SifreSifirlaIstekResponse>(
    "/auth/sifre-sifirla/istek",
    { kimlik },
  );
  return data;
}

export async function sifreSifirlaOnay(
  kimlik: string,
  kod: string,
  yeni_sifre: string,
): Promise<void> {
  await authClient.post("/auth/sifre-sifirla/onay", {
    kimlik,
    kod,
    yeni_sifre,
  });
}
