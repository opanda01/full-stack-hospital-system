import type { CurrentUser } from "./authStore";
import * as authApi from "./authApi";
import { MOCK_USERS, type MockUser } from "./mock-users";

export const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH === "true";

export type AuthLoginResult = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  rol: string;
  permissions: string[];
  sifre_degistirmeli_mi: boolean;
  kvkk_onaylandi_mi: boolean;
  user: CurrentUser;
};

function delay(ms = 300) {
  return new Promise((r) => setTimeout(r, ms));
}

function toCurrentUser(u: MockUser): CurrentUser {
  return {
    id: Number(u.id),
    email: u.email,
    ad: u.ad,
    soyad: u.soyad,
    rol: u.rol,
    aktif_mi: true,
    kullanici_adi: u.kullanici_adi ?? null,
    sifre_degistirmeli_mi: Boolean(u.sifre_degistirmeli_mi),
    kvkk_onaylandi_mi: u.kvkk_onaylandi_mi !== false,
  };
}

function findMockByKimlik(kimlik: string, sifre: string): MockUser | undefined {
  const k = kimlik.trim().toLowerCase();
  return MOCK_USERS.find((u) => {
    if (u.sifre !== sifre) return false;
    if (u.email.toLowerCase() === k) return true;
    if (u.kullanici_adi?.toLowerCase() === k) return true;
    if (u.sicil_no?.toLowerCase() === k) return true;
    return false;
  });
}

function findByMockToken(
  token: string | null | undefined,
  prefix: "mock-token-" | "mock-refresh-",
): MockUser | undefined {
  if (!token?.startsWith(prefix)) return undefined;
  const id = token.slice(prefix.length);
  return MOCK_USERS.find((u) => u.id === id);
}

async function readAccessToken(): Promise<string | null> {
  const { useAuthStore } = await import("./authStore");
  return useAuthStore.getState().accessToken ?? useAuthStore.getState().token;
}

export async function login(kimlik: string, sifre: string): Promise<AuthLoginResult> {
  if (USE_MOCK_AUTH) {
    await delay(300);
    const user = findMockByKimlik(kimlik, sifre);
    if (!user) {
      throw new Error("Kimlik veya şifre hatalı");
    }
    const current = toCurrentUser(user);
    return {
      access_token: `mock-token-${user.id}`,
      refresh_token: `mock-refresh-${user.id}`,
      token_type: "bearer",
      rol: user.rol,
      permissions: ["*"],
      sifre_degistirmeli_mi: current.sifre_degistirmeli_mi,
      kvkk_onaylandi_mi: current.kvkk_onaylandi_mi,
      user: current,
    };
  }

  const data = await authApi.login(kimlik, sifre);
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    token_type: data.token_type,
    rol: data.rol,
    permissions: data.permissions ?? [],
    sifre_degistirmeli_mi: Boolean(data.sifre_degistirmeli_mi),
    kvkk_onaylandi_mi: data.kvkk_onaylandi_mi !== false,
    user: {
      id: 0,
      email: kimlik.includes("@") ? kimlik : null,
      ad: "",
      soyad: "",
      rol: data.rol,
      aktif_mi: true,
      sifre_degistirmeli_mi: Boolean(data.sifre_degistirmeli_mi),
      kvkk_onaylandi_mi: data.kvkk_onaylandi_mi !== false,
    },
  };
}

export async function me(): Promise<CurrentUser> {
  if (USE_MOCK_AUTH) {
    await delay(150);
    const access = await readAccessToken();
    const user = findByMockToken(access, "mock-token-");
    if (!user) {
      throw new Error("Oturum geçersiz");
    }
    return toCurrentUser(user);
  }
  const data = await authApi.me();
  return {
    id: data.id,
    email: data.email,
    ad: data.ad,
    soyad: data.soyad,
    rol: data.rol,
    aktif_mi: data.aktif_mi,
    kullanici_adi: data.kullanici_adi ?? null,
    sifre_degistirmeli_mi: Boolean(data.sifre_degistirmeli_mi),
    kvkk_onaylandi_mi: data.kvkk_onaylandi_mi !== false,
  };
}

export async function refresh(refreshToken: string): Promise<AuthLoginResult> {
  if (USE_MOCK_AUTH) {
    await delay(150);
    const user = findByMockToken(refreshToken, "mock-refresh-");
    if (!user) {
      throw new Error("Oturum yenilenemedi");
    }
    const current = toCurrentUser(user);
    return {
      access_token: `mock-token-${user.id}`,
      refresh_token: `mock-refresh-${user.id}`,
      token_type: "bearer",
      rol: user.rol,
      permissions: ["*"],
      sifre_degistirmeli_mi: current.sifre_degistirmeli_mi,
      kvkk_onaylandi_mi: current.kvkk_onaylandi_mi,
      user: current,
    };
  }

  const data = await authApi.refresh(refreshToken);
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    token_type: data.token_type,
    rol: data.rol,
    permissions: data.permissions ?? [],
    sifre_degistirmeli_mi: Boolean(data.sifre_degistirmeli_mi),
    kvkk_onaylandi_mi: data.kvkk_onaylandi_mi !== false,
    user: {
      id: 0,
      email: null,
      ad: "",
      soyad: "",
      rol: data.rol,
      aktif_mi: true,
      sifre_degistirmeli_mi: Boolean(data.sifre_degistirmeli_mi),
      kvkk_onaylandi_mi: data.kvkk_onaylandi_mi !== false,
    },
  };
}

export async function logout(refreshToken: string): Promise<void> {
  if (USE_MOCK_AUTH) {
    await delay(100);
    return;
  }
  await authApi.logout(refreshToken);
}

export async function sifreDegistir(
  eski_sifre: string,
  yeni_sifre: string,
): Promise<void> {
  if (USE_MOCK_AUTH) {
    await delay(200);
    const access = await readAccessToken();
    const user = findByMockToken(access, "mock-token-");
    if (!user) throw new Error("Oturum geçersiz");
    if (user.sifre !== eski_sifre) throw new Error("Eski şifre hatalı");
    user.sifre = yeni_sifre;
    user.sifre_degistirmeli_mi = false;
    return;
  }
  await authApi.sifreDegistir(eski_sifre, yeni_sifre);
}

export async function kvkkOnay(onay = true): Promise<CurrentUser> {
  if (USE_MOCK_AUTH) {
    await delay(200);
    const access = await readAccessToken();
    const user = findByMockToken(access, "mock-token-");
    if (!user) throw new Error("Oturum geçersiz");
    if (!onay) throw new Error("KVKK onayı zorunludur");
    user.kvkk_onaylandi_mi = true;
    return toCurrentUser(user);
  }
  const data = await authApi.kvkkOnay(onay);
  return {
    id: data.id,
    email: data.email,
    ad: data.ad,
    soyad: data.soyad,
    rol: data.rol,
    aktif_mi: data.aktif_mi,
    kullanici_adi: data.kullanici_adi ?? null,
    sifre_degistirmeli_mi: Boolean(data.sifre_degistirmeli_mi),
    kvkk_onaylandi_mi: data.kvkk_onaylandi_mi !== false,
  };
}
