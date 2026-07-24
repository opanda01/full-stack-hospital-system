import { Platform } from "react-native";

type SecureStoreModule = typeof import("expo-secure-store");

function nativeSecureStore(): SecureStoreModule {
  // Web'de native modül yüklenmesin (import anında hata verebilir)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("expo-secure-store") as SecureStoreModule;
}

export async function storageGet(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return nativeSecureStore().getItemAsync(key);
}

export async function storageSet(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(key, value);
    return;
  }
  await nativeSecureStore().setItemAsync(key, value);
}

export async function storageDelete(key: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(key);
    return;
  }
  await nativeSecureStore().deleteItemAsync(key);
}
