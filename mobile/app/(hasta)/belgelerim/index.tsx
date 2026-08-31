import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { fetchBelgeler } from "@/shared/api/hastaApi";
import type { HastaBelgeDto } from "@/shared/api/types";
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

type BelgeFiltre = "TUMU" | "EPIKRIZ" | "RECETE" | "TIBBI_RAPOR" | "SEVK";

const FILTRELER: { id: BelgeFiltre; label: string }[] = [
  { id: "TUMU", label: "Tümü" },
  { id: "EPIKRIZ", label: "Epikriz" },
  { id: "RECETE", label: "Reçete" },
  { id: "TIBBI_RAPOR", label: "Rapor" },
  { id: "SEVK", label: "Sevk" },
];

function belgeFiltreUygun(item: HastaBelgeDto, filtre: BelgeFiltre): boolean {
  if (filtre === "TUMU") return true;
  if (filtre === "EPIKRIZ") return item.kaynak === "EPIKRIZ";
  return item.tur === filtre;
}

export default function BelgelerimScreen() {
  const [filtre, setFiltre] = useState<BelgeFiltre>("TUMU");
  const [moreItems, setMoreItems] = useState<HastaBelgeDto[]>([]);
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
    queryKey: queryKeys.belgelerIlkSayfa,
    queryFn: () => fetchBelgeler(1, PAGE_SIZE),
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

  const filteredItems = useMemo(
    () => items.filter((i) => belgeFiltreUygun(i, filtre)),
    [items, filtre],
  );

  const queryHata = error instanceof Error ? error.message : null;

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || items.length >= total) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const body = await fetchBelgeler(nextPage, PAGE_SIZE);
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
      <View style={styles.filtreRow}>
        {FILTRELER.map((f) => (
          <Pressable
            key={f.id}
            style={[styles.filtreChip, filtre === f.id && styles.filtreChipActive]}
            onPress={() => setFiltre(f.id)}
          >
            <Text
              style={[
                styles.filtreText,
                filtre === f.id && styles.filtreTextActive,
              ]}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={filteredItems}
        keyExtractor={(i) => `${i.kaynak}-${i.id}`}
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
        ListEmptyComponent={
          <EmptyText>
            {filtre === "TUMU"
              ? "Onaylı belge yok (epikriz, reçete, sevk, rapor)"
              : "Bu kategoride belge yok"}
          </EmptyText>
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
  filtreRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  filtreChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
  },
  filtreChipActive: {
    backgroundColor: colors.accent,
  },
  filtreText: { fontSize: 13, color: colors.muted, fontWeight: "600" },
  filtreTextActive: { color: "#fff" },
  title: { fontWeight: "700", color: colors.text },
  meta: { color: colors.muted, fontSize: 13 },
  ozet: { color: colors.text, marginTop: 4, fontSize: 14 },
});
