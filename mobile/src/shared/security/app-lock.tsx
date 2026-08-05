import { storageDelete, storageGet, storageSet } from "@/shared/auth/storage";
import * as LocalAuthentication from "expo-local-authentication";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  StyleSheet,
  AppState,
  type AppStateStatus,
} from "react-native";
import { useAuthStore } from "@/shared/auth";
import { colors } from "@/shared/ui";

const LOCK_ENABLED_KEY = "hbys_app_lock_enabled";

export async function getAppLockEnabled(): Promise<boolean> {
  const v = await storageGet(LOCK_ENABLED_KEY);
  return v === "1";
}

export async function setAppLockEnabled(enabled: boolean): Promise<void> {
  if (enabled) await storageSet(LOCK_ENABLED_KEY, "1");
  else await storageDelete(LOCK_ENABLED_KEY);
}

async function canUseBiometric(): Promise<boolean> {
  const hw = await LocalAuthentication.hasHardwareAsync();
  if (!hw) return false;
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return enrolled;
}

export function AppLockGate({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const [checking, setChecking] = useState(true);
  const [locked, setLocked] = useState(false);
  const [lockEnabled, setLockEnabled] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const tryUnlock = useCallback(async () => {
    setHata(null);
    const okBio = await canUseBiometric();
    if (!okBio) {
      setHata("Bu cihazda biyometrik doğrulama kullanılamıyor.");
      setLocked(false);
      return;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "HBYS Hasta kilidini aç",
      cancelLabel: "İptal",
      disableDeviceFallback: false,
    });
    if (result.success) setLocked(false);
    else if (result.error !== "user_cancel")
      setHata("Doğrulama başarısız. Tekrar deneyin.");
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!token) {
        if (active) {
          setLocked(false);
          setChecking(false);
        }
        return;
      }
      const enabled = await getAppLockEnabled();
      if (!active) return;
      setLockEnabled(enabled);
      if (!enabled) {
        setLocked(false);
        setChecking(false);
        return;
      }
      const bio = await canUseBiometric();
      if (!bio) {
        setLocked(false);
        setChecking(false);
        return;
      }
      setLocked(true);
      setChecking(false);
    })();
    return () => {
      active = false;
    };
  }, [token, tryUnlock]);

  useEffect(() => {
    if (!token || !lockEnabled) return;
    const onChange = (state: AppStateStatus) => {
      if (state === "active") {
        void canUseBiometric().then((bio) => {
          if (bio) setLocked(true);
        });
      }
    };
    const sub = AppState.addEventListener("change", onChange);
    return () => sub.remove();
  }, [token, lockEnabled]);

  if (!token || !lockEnabled) return <>{children}</>;
  if (checking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  if (!locked) return <>{children}</>;

  return (
    <View style={styles.center}>
      <Text style={styles.title}>Uygulama kilitli</Text>
      <Text style={styles.sub}>Devam etmek için biyometrik doğrulama yapın.</Text>
      {hata ? <Text style={styles.err}>{hata}</Text> : null}
      <Pressable style={styles.btn} onPress={() => void tryUnlock()}>
        <Text style={styles.btnText}>Kilidi aç</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#f8fafc",
  },
  title: { fontSize: 20, fontWeight: "700", color: colors.text },
  sub: { marginTop: 8, color: colors.muted, textAlign: "center" },
  err: { marginTop: 12, color: colors.danger, textAlign: "center" },
  btn: {
    marginTop: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  btnText: { color: "#fff", fontWeight: "600" },
});
