import { apiFetch } from "@/shared/api/http";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { isRunningInExpoGo } from "expo";
import { Platform } from "react-native";

function projectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants.expoConfig as { projectId?: string } | undefined)?.projectId
  );
}

/** SDK 53+ Expo Go (özellikle Android) uzaktan push desteklemiyor. */
export function isPushAvailableInThisRuntime(): boolean {
  if (Platform.OS === "web") return false;
  if (isRunningInExpoGo()) return false;
  return true;
}

type NotificationsModule = typeof import("expo-notifications");
let notificationsMod: NotificationsModule | null = null;
let handlerConfigured = false;

async function getNotifications(): Promise<NotificationsModule | null> {
  if (!isPushAvailableInThisRuntime()) return null;
  if (!notificationsMod) {
    notificationsMod = await import("expo-notifications");
  }
  if (!handlerConfigured && notificationsMod) {
    notificationsMod.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    handlerConfigured = true;
  }
  return notificationsMod;
}

export async function ensurePushPermissions(): Promise<boolean> {
  const Notifications = await getNotifications();
  if (!Notifications) return false;
  if (!Device.isDevice) return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function getExpoPushToken(): Promise<string | null> {
  const Notifications = await getNotifications();
  if (!Notifications) return null;
  if (!Device.isDevice) return null;
  const ok = await ensurePushPermissions();
  if (!ok) return null;
  try {
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: projectId(),
    });
    return token.data;
  } catch {
    return null;
  }
}

export async function registerPushTokenWithBackend(): Promise<void> {
  const pushToken = await getExpoPushToken();
  if (!pushToken) return;
  const platform =
    Platform.OS === "ios"
      ? "ios"
      : Platform.OS === "android"
        ? "android"
        : "unknown";
  await apiFetch("/hastalar/ben/mobil-cihaz", {
    method: "PUT",
    body: JSON.stringify({ push_token: pushToken, platform }),
  });
}

export async function unregisterPushTokenWithBackend(
  pushToken: string | null,
): Promise<void> {
  if (!pushToken) return;
  const q = new URLSearchParams({ push_token: pushToken });
  await apiFetch(`/hastalar/ben/mobil-cihaz?${q}`, { method: "DELETE" });
}

let cachedPushToken: string | null = null;

export async function syncPushRegistration(): Promise<void> {
  if (!isPushAvailableInThisRuntime()) return;
  cachedPushToken = await getExpoPushToken();
  if (cachedPushToken) {
    await registerPushTokenWithBackend();
  }
}

export function lastKnownPushToken(): string | null {
  return cachedPushToken;
}
