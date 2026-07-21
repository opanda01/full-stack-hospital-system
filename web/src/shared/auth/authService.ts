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
  };
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

export async function login(email: string, sifre: string): Promise<AuthLoginResult> {
  if (USE_MOCK_AUTH) {
    await delay(300);
    const user = MOCK_USERS.find((u) => u.email === email && u.sifre === sifre);
    if (!user) {
      throw new Error("E-posta veya şifre hatalı");
    }
    const current = toCurrentUser(user);
    return {
      access_token: `mock-token-${user.id}`,
      refresh_token: `mock-refresh-${user.id}`,
      token_type: "bearer",
      rol: user.rol,
      permissions: ["*"],
      user: current,
    };
  }

  const data = await authApi.login(email, sifre);
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    token_type: data.token_type,
    rol: data.rol,
    permissions: data.permissions ?? [],
    user: {
      id: 0,
      email,
      ad: "",
      soyad: "",
      rol: data.rol,
      aktif_mi: true,
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
  return authApi.me();
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
    user: {
      id: 0,
      email: "",
      ad: "",
      soyad: "",
      rol: data.rol,
      aktif_mi: true,
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
