import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import {
  isOnboardingApiDetail,
  onboardingPath,
  useAuthStore,
} from "@/shared/auth";
import * as authService from "@/shared/auth/authService";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const { accessToken, token } = useAuthStore.getState();
  const bearer = accessToken ?? token;
  if (bearer) {
    config.headers.Authorization = `Bearer ${bearer}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setTokens, clear } = useAuthStore.getState();
  if (!refreshToken) {
    clear();
    return null;
  }
  try {
    const res = await authService.refresh(refreshToken);
    setTokens(res.access_token, res.refresh_token);
    if (res.rol) {
      useAuthStore.setState({
        roles: [res.rol],
        permissions: res.permissions ?? [],
      });
    }
    return res.access_token;
  } catch {
    clear();
    return null;
  }
}

function redirectOnboardingIfNeeded(detail: unknown) {
  if (typeof window === "undefined") return;
  if (!isOnboardingApiDetail(detail)) return;
  const user = useAuthStore.getState().currentUser;
  if (!user) return;
  const path = onboardingPath(user);
  if (!window.location.pathname.startsWith(path)) {
    window.location.href = path;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<{ detail?: unknown }>) => {
    const status = error.response?.status;
    const detail = error.response?.data?.detail;

    if (status === 403) {
      redirectOnboardingIfNeeded(detail);
      return Promise.reject(error);
    }

    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    if (status !== 401 || !original || original._retry) {
      return Promise.reject(error);
    }
    if (
      original.url?.includes("/auth/login") ||
      original.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }
    original._retry = true;
    refreshPromise ??= refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
    const newToken = await refreshPromise;
    if (!newToken) {
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith("/giris")
      ) {
        window.location.href = "/giris";
      }
      return Promise.reject(error);
    }
    original.headers.Authorization = `Bearer ${newToken}`;
    return api(original);
  },
);
