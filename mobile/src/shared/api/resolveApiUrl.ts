import Constants from "expo-constants";
import { Platform } from "react-native";

const isDev =
  typeof __DEV__ !== "undefined"
    ? __DEV__
    : process.env.NODE_ENV !== "production";

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

function isLoopbackHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

/** Metro / Expo Go ile aynı makineye bağlanır (fiziksel cihaz + LAN). */
function devApiUrlFromMetro(): string {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    if (host && !isLoopbackHost(host)) {
      return `http://${host}:8000`;
    }
  }
  if (Platform.OS === "android") {
    return "http://10.0.2.2:8000";
  }
  return "http://localhost:8000";
}

/** EXPO_PUBLIC_API_URL açıkça LAN IP ise öncelikli (fiziksel cihaz). */
function explicitEnvApiUrl(): string | null {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!fromEnv) return null;
  try {
    const { hostname } = new URL(fromEnv);
    if (!isLoopbackHost(hostname)) {
      return stripTrailingSlash(fromEnv);
    }
  } catch {
    return stripTrailingSlash(fromEnv);
  }
  return null;
}

export function resolveApiUrl(): string {
  const explicit = explicitEnvApiUrl();
  if (explicit) return explicit;

  if (isDev && Platform.OS !== "web") {
    return stripTrailingSlash(devApiUrlFromMetro());
  }

  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) return stripTrailingSlash(fromEnv);
  return stripTrailingSlash(devApiUrlFromMetro());
}

let cached: string | null = null;

export function getApiUrl(): string {
  if (cached === null) {
    cached = resolveApiUrl();
  }
  return cached;
}
