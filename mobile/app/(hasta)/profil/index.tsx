import { useEffect, useState } from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { apiFetch } from "@/shared/api";
import { useAuthStore } from "@/shared/auth";

type Me = { ad: string; soyad: string; email: string; rol: string };

export default function ProfilScreen() {
  const logout = useAuthStore((s) => s.logout);
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    (async () => {
      const res = await apiFetch("/auth/me");
      if (res.ok) setMe(await res.json());
    })();
  }, []);

  return (
    <View style={styles.container}>
      {me ? (
        <>
          <Text style={styles.title}>
            {me.ad} {me.soyad}
          </Text>
          <Text>{me.email}</Text>
          <Text>Rol: {me.rol}</Text>
        </>
      ) : (
        <Text>Yükleniyor…</Text>
      )}
      <Pressable
        style={styles.button}
        onPress={() => {
          logout();
          router.replace("/(auth)/giris");
        }}
      >
        <Text style={styles.buttonText}>Çıkış</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 8, backgroundColor: "#f8fafc" },
  title: { fontSize: 18, fontWeight: "600" },
  button: {
    marginTop: 24,
    backgroundColor: "#0c4a6e",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600" },
});
