import { useCallback, useState } from "react";
import {
  FlatList,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { apiFetch } from "@/shared/api";

type Tetkik = {
  id: number;
  tetkik_turu: string;
  durum: string;
  sonuc_dosyasi: string | null;
  istek_yapan_doktor_id: number;
};

export default function TetkikSonuclarimScreen() {
  const [items, setItems] = useState<Tetkik[]>([]);
  const [loading, setLoading] = useState(true);
  const [hata, setHata] = useState<string | null>(null);

  const load = useCallback(async () => {
    setHata(null);
    try {
      const res = await apiFetch("/tetkikler/");
      if (!res.ok) {
        setHata("Tetkikler yüklenemedi");
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
          <Text style={styles.empty}>Tetkik sonucu yok</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.tetkik_turu}</Text>
            <Text>Durum: {item.durum}</Text>
            <Text style={styles.meta}>
              {item.sonuc_dosyasi ?? "Sonuç bekleniyor"}
            </Text>
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
  meta: { color: "#64748b", fontSize: 13 },
  empty: { color: "#64748b", textAlign: "center", marginTop: 24 },
  error: { color: "#dc2626", marginBottom: 8 },
});
