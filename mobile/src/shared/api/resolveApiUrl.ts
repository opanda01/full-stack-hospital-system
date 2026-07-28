import Constants from "expo-constants";
import { Platform } from "react-native";

/** Metro dev sunucusu üzerinden backend proxy (port 8000 güvenlik duvarında kapalı olsa da çalışır). */
export const METRO_API_PREFIX = "/hbys-api";

/** Expo Metro varsayılanı (metroPort.cjs ile aynı). */
const DEFAULT_METRO_PORT = 8081;

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

function hostUriCandidates(): (string | undefined)[] {
  return [
    Constants.expoConfig?.hostUri,
    (Constants as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig
      ?.debuggerHost,
    (
      Constants.expoConfig?.extra as { expoClient?: { hostUri?: string } }
    )?.expoClient?.hostUri,
    (Constants.manifest2?.extra as { expoClient?: { hostUri?: string } })
      ?.expoClient?.hostUri,
    (Constants as { manifest?: { debuggerHost?: string } }).manifest
      ?.debuggerHost,
  ];
}

function metroLanHost(): string | null {
  for (const uri of hostUriCandidates()) {
    if (!uri) continue;
    const host = uri.split(":")[0]?.trim();
    if (host && !isLoopbackHost(host)) {
      return host;
    }
  }
  return null;
}

function metroPortFromExtra(): number | null {
  const raw = (
    Constants.expoConfig?.extra as { metroPort?: number | string } | undefined
  )?.metroPort;
  if (raw == null) return null;
  const n = typeof raw === "number" ? raw : Number.parseInt(String(raw), 10);
  return !Number.isNaN(n) && n > 0 ? n : null;
}

function metroPort(): number {
  for (const uri of hostUriCandidates()) {
    if (!uri?.includes(":")) continue;
    const port = Number.parseInt(uri.split(":")[1] ?? "", 10);
    if (!Number.isNaN(port) && port > 0) return port;
  }
  return metroPortFromExtra() ?? DEFAULT_METRO_PORT;
}

function lanHostFromExpoExtra(): string | null {
  const extra = Constants.expoConfig?.extra as
    | { lanHost?: string; devApiBaseUrl?: string }
    | undefined;
  const lan = extra?.lanHost?.trim();
  if (lan && !isLoopbackHost(lan)) return lan;

  const fromExtra = extra?.devApiBaseUrl?.trim();
  if (!fromExtra) return null;
  try {
    return new URL(fromExtra).hostname;
  } catch {
    return null;
  }
}

function useDirectBackendPort(): boolean {
  return process.env.EXPO_PUBLIC_API_DIRECT === "1";
}

/** Geliştirmede API, Metro ile aynı host:port üzerinden proxy edilir. */
function devApiUrlViaMetroProxy(): string | null {
  const port = metroPort();
  const lanHost = metroLanHost() ?? lanHostFromExpoExtra();

  if (lanHost && !isLoopbackHost(lanHost)) {
    return `http://${lanHost}:${port}${METRO_API_PREFIX}`;
  }

  const isAndroidEmulator =
    Platform.OS === "android" && Constants.isDevice === false;
  if (isAndroidEmulator) {
    return `http://10.0.2.2:${port}${METRO_API_PREFIX}`;
  }

  if (Platform.OS === "ios" && Constants.isDevice === false) {
    return `http://localhost:${port}${METRO_API_PREFIX}`;
  }

  if (lanHost) {
    return `http://${lanHost}:${port}${METRO_API_PREFIX}`;
  }

  return null;
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

function devApiUrlDirect(): string {
  const fromExtra = (
    Constants.expoConfig?.extra as { devApiBaseUrl?: string } | undefined
  )?.devApiBaseUrl?.trim();
  if (fromExtra) {
    try {
      const { hostname } = new URL(fromExtra);
      if (!isLoopbackHost(hostname) || Constants.isDevice === false) {
        return stripTrailingSlash(fromExtra);
      }
    } catch {
      return stripTrailingSlash(fromExtra);
    }
  }

  const lanHost = metroLanHost() ?? lanHostFromExpoExtra();
  if (lanHost) {
    return `http://${lanHost}:8000`;
  }

  const isAndroidEmulator =
    Platform.OS === "android" && Constants.isDevice === false;
  if (isAndroidEmulator) {
    return "http://10.0.2.2:8000";
  }

  if (Platform.OS === "ios" && Constants.isDevice === false) {
    return "http://localhost:8000";
  }

  return "http://localhost:8000";
}

export function resolveApiUrl(): string {
  // Açık LAN URL (EXPO_PUBLIC_API_URL) fiziksel cihazda öncelikli.
  const explicit = explicitEnvApiUrl();
  if (explicit) return explicit;

  if (isDev && Platform.OS !== "web" && !useDirectBackendPort()) {
    const viaMetro = devApiUrlViaMetroProxy();
    if (viaMetro) return stripTrailingSlash(viaMetro);
  }

  if (isDev && Platform.OS !== "web") {
    return stripTrailingSlash(devApiUrlDirect());
  }

  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) return stripTrailingSlash(fromEnv);
  return stripTrailingSlash(devApiUrlDirect());
}

let cached: string | null = null;

export function getApiUrl(): string {
  if (isDev) {
    return resolveApiUrl();
  }
  if (cached === null) {
    cached = resolveApiUrl();
  }
  return cached;
}
