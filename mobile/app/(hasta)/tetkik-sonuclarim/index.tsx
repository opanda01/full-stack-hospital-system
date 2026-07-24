import { useCallback, useRef, useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { apiFetch } from "@/shared/api";

type Tetkik = {
  id: string;
  tetkik_turu: string;
  durum: string;
  sonuc_dosyasi: string | null;
  istek_yapan_doktor_id: number;
};

type Page<T> = { items: T[]; total: number; page: number; page_size: number };

const PAGE_SIZE = 20;

function unwrapPage<T>(data: Page<T> | T[]): T[] {
  if (Array.isArray(data)) return data;
  return data?.items ?? [];
}

export default function TetkikSonuclarimScreen() {
  const [items, setItems] = useState<Tetkik[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const loadingMoreRef = useRef(false);

  const loadPage = useCallback(async (pageNum: number, append: boolean) => {
    const res = await apiFetch(
      `/tetkikler/?page=${pageNum}&page_size=${PAGE_SIZE}`,
    );
    if (!res.ok) {
      throw new Error("Tetkikler yüklenemedi");
    }
    const body = (await res.json()) as Page<Tetkik>;
    const chunk = unwrapPage(body);
    setTotal(body.total ?? chunk.length);
    setPage(pageNum);
    setItems((prev) => (append ? [...prev, ...chunk] : chunk));
  }, []);

  const refresh = useCallback(async () => {
    setHata(null);
    try {
      await loadPage(1, false);
    } catch {
      setHata("Sunucuya bağlanılamadı");
    } finally {
      setLoading(false);
    }
  }, [loadPage]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void refresh();
    }, [refresh]),
  );

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || items.length >= total) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      await loadPage(page + 1, true);
    } catch {
      setHata("Daha fazla yüklenemedi");
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [items.length, loadPage, page, total]);

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
          <RefreshControl refreshing={false} onRefresh={() => void refresh()} />
        }
        onEndReached={() => void loadMore()}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator color="#0369a1" style={{ marginVertical: 12 }} />
          ) : null
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
