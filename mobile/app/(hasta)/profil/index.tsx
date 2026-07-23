import { useCallback, useState } from "react";
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { fetchMe, logoutApi, type MeResponse } from "@/shared/api";

export default function ProfilScreen() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setHata(null);
      (async () => {
        try {
          setMe(await fetchMe());
        } catch (e) {
          setHata(e instanceof Error ? e.message : "Profil yüklenemedi");
        } finally {
          setLoading(false);
        }
      })();
    }, []),
  );

  const onLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutApi();
      router.replace("/(auth)/giris");
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#0369a1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {hata ? <Text style={styles.error}>{hata}</Text> : null}
      {me ? (
        <>
          <Text style={styles.title}>
            {me.ad} {me.soyad}
          </Text>
          {me.email ? <Text>{me.email}</Text> : null}
          <Text style={styles.meta}>Rol: {me.rol}</Text>
          <Text style={styles.meta}>
            KVKK: {me.kvkk_onaylandi_mi ? "Onaylandı" : "Bekliyor"}
          </Text>
          <Text style={styles.note}>
            Bu uygulama hasta oturumu (`oturum_tipi=hasta`) ile çalışır. Personel
            paneli web üzerindedir.
          </Text>
        </>
      ) : (
        <Text>Profil bilgisi yok</Text>
      )}
      <Pressable
        style={[styles.button, loggingOut && styles.buttonDisabled]}
        onPress={() => void onLogout()}
        disabled={loggingOut}
      >
        <Text style={styles.buttonText}>
          {loggingOut ? "Çıkış yapılıyor…" : "Çıkış"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 8, backgroundColor: "#f8fafc" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  title: { fontSize: 18, fontWeight: "600", color: "#0f172a" },
  meta: { color: "#475569" },
  note: {
    marginTop: 12,
    color: "#64748b",
    fontSize: 13,
    lineHeight: 18,
  },
  button: {
    marginTop: 24,
    backgroundColor: "#0c4a6e",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "600" },
  error: { color: "#dc2626" },
});
