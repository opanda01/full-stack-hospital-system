import { useCallback, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { fetchBelgeler } from "@/shared/api/hastaApi";
import type { HastaBelgeDto } from "@/shared/api/types";
import { go } from "@/shared/nav";
import { Card, EmptyText, ErrorText, Loading, Screen, colors } from "@/shared/ui";

const PAGE_SIZE = 20;

export default function BelgelerimScreen() {
  const [items, setItems] = useState<HastaBelgeDto[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const loadingMoreRef = useRef(false);

  const loadPage = useCallback(async (pageNum: number, append: boolean) => {
    const body = await fetchBelgeler(pageNum, PAGE_SIZE);
    setTotal(body.total);
    setPage(pageNum);
    setItems((prev) => (append ? [...prev, ...body.items] : body.items));
  }, []);

  const refresh = useCallback(async () => {
    setHata(null);
    try {
      await loadPage(1, false);
    } catch {
      setHata("Belgeler yüklenemedi");
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

  if (loading) return <Loading />;

  return (
    <Screen>
      <ErrorText>{hata}</ErrorText>
      <FlatList
        data={items}
        keyExtractor={(i) => `${i.kaynak}-${i.id}`}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => void refresh()} />
        }
        onEndReached={() => void loadMore()}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator color={colors.accent} style={{ marginVertical: 12 }} />
          ) : null
        }
        ListEmptyComponent={
          <EmptyText>Onaylı belge yok (epikriz, reçete, sevk, rapor)</EmptyText>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              go(
                `/(hasta)/belgelerim/${item.id}?kaynak=${encodeURIComponent(item.kaynak)}`,
              )
            }
          >
            <Card>
              <Text style={styles.title}>{item.baslik}</Text>
              <Text style={styles.meta}>
                {item.kaynak === "EPIKRIZ" ? "Epikriz" : item.tur ?? "Belge"} ·{" "}
                {item.durum}
              </Text>
              {item.ozet ? (
                <Text numberOfLines={2} style={styles.ozet}>
                  {item.ozet}
                </Text>
              ) : null}
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontWeight: "700", color: colors.text },
  meta: { color: colors.muted, fontSize: 13 },
  ozet: { color: colors.text, marginTop: 4, fontSize: 14 },
});
