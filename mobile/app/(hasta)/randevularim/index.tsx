import { useCallback, useState } from "react";
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { apiFetch } from "@/shared/api";

type Randevu = {
  id: number;
  tarih_saat: string;
  durum: string;
  doktor_id: number;
  departman_id: number;
  hasta_ad_soyad: string | null;
};

export default function RandevularimScreen() {
  const [items, setItems] = useState<Randevu[]>([]);
  const [loading, setLoading] = useState(true);
  const [hata, setHata] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setHata(null);
    try {
      const res = await apiFetch("/randevular/");
      if (!res.ok) {
        setHata("Randevular yüklenemedi");
        return;
      }
      setItems(await res.json());
    } catch {
      setHata("Sunucuya bağlanılamadı");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const iptal = async (id: number) => {
    setBusyId(id);
    setHata(null);
    try {
      const res = await apiFetch(`/randevular/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setHata("İptal başarısız");
        return;
      }
      await load();
    } finally {
      setBusyId(null);
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
      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => void load()} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>Henüz randevunuz yok</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {new Date(item.tarih_saat).toLocaleString("tr-TR", {
                timeZone: "Europe/Istanbul",
              })}
            </Text>
            <Text>Durum: {item.durum}</Text>
            <Text style={styles.meta}>Doktor #{item.doktor_id}</Text>
            {item.durum !== "IPTAL" && item.durum !== "TAMAMLANDI" ? (
              <Pressable
                onPress={() => void iptal(item.id)}
                disabled={busyId === item.id}
              >
                <Text style={styles.link}>
                  {busyId === item.id ? "İptal ediliyor…" : "İptal et"}
                </Text>
              </Pressable>
            ) : null}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f8fafc" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  card: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 4,
  },
  cardTitle: { fontWeight: "600", color: "#0f172a" },
  meta: { color: "#64748b", fontSize: 12 },
  link: { color: "#b91c1c", marginTop: 4 },
  empty: { color: "#64748b", textAlign: "center", marginTop: 24 },
  error: { color: "#dc2626", marginBottom: 8 },
});
