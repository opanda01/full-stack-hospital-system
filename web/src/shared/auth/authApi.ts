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
};

export type MeResponse = {
  id: number;
  email: string;
  ad: string;
  soyad: string;
  rol: string;
  aktif_mi: boolean;
};

export async function login(email: string, sifre: string): Promise<TokenResponse> {
  const { data } = await authClient.post<TokenResponse>("/auth/login", {
    email,
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
