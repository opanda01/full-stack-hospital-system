import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { fetchMuayeneler } from "@/shared/api/hastaApi";
import type { MuayeneDto } from "@/shared/api/types";
import { go } from "@/shared/nav";
import { useRefetchOnTabFocus } from "@/shared/query/focus";
import { queryKeys } from "@/shared/query/client";
import {
  Card,
  EmptyText,
  ErrorText,
  Screen,
  SimpleListScreenSkeleton,
  colors,
} from "@/shared/ui";

const PAGE_SIZE = 20;

export default function MuayenelerimScreen() {
  const [moreItems, setMoreItems] = useState<MuayeneDto[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const loadingMoreRef = useRef(false);

  const {
    data: firstPage,
    error,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: queryKeys.muayeneler,
    queryFn: () => fetchMuayeneler(1, PAGE_SIZE),
  });

  useRefetchOnTabFocus(refetch);

  useEffect(() => {
    if (!firstPage) return;
    setTotal(firstPage.total);
    setPage(1);
    setMoreItems([]);
  }, [firstPage]);

  const items = firstPage
    ? [...firstPage.items, ...moreItems]
    : [];

  const queryHata = error instanceof Error ? error.message : null;

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || items.length >= total) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const body = await fetchMuayeneler(nextPage, PAGE_SIZE);
      setTotal(body.total);
      setPage(nextPage);
      setMoreItems((prev) => [...prev, ...body.items]);
    } catch {
      setHata("Daha fazla yüklenemedi");
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [items.length, page, total]);

  if (isLoading && !firstPage) {
    return <SimpleListScreenSkeleton withHero={false} />;
  }

  return (
    <Screen>
      <ErrorText>{hata ?? queryHata}</ErrorText>
      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
        }
        onEndReached={() => void loadMore()}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator color={colors.accent} style={{ marginVertical: 12 }} />
          ) : null
        }
        ListEmptyComponent={<EmptyText>Muayene kaydı yok</EmptyText>}
        renderItem={({ item }) => (
          <Pressable onPress={() => go(`/(hasta)/muayenelerim/${item.id}`)}>
            <Card>
              <Text style={styles.title}>Muayene #{item.id}</Text>
              <Text style={styles.meta}>Randevu: {item.randevu_id}</Text>
              <Text>{item.tani ?? "Tanı girilmemiş"}</Text>
              {item.recete_kalemleri?.length ? (
                <Text style={styles.meta}>
                  {item.recete_kalemleri.length} reçete kalemi
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
  meta: { color: colors.muted, fontSize: 13, marginTop: 4 },
});
