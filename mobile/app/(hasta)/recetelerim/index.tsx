import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  StyleSheet,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { fetchRecetelerimSatirlari } from "@/shared/api/hastaApi";
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

export default function RecetelerimScreen() {
  const {
    data: items = [],
    error,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: queryKeys.receteler,
    queryFn: fetchRecetelerimSatirlari,
  });

  useRefetchOnTabFocus(refetch);

  const hata = error instanceof Error ? error.message : null;

  if (isLoading && items.length === 0) {
    return <SimpleListScreenSkeleton withHero={false} />;
  }

  return (
    <Screen>
      <ErrorText>{hata}</ErrorText>
      <FlatList
        data={items}
        keyExtractor={(i) => i.key}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
        }
        ListEmptyComponent={<EmptyText>Reçete kaydı yok</EmptyText>}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              if (item.klinikId != null) {
                go(
                  `/(hasta)/belgelerim/${item.klinikId}?kaynak=${encodeURIComponent("KLINIK_ONAY")}`,
                );
              } else if (item.muayeneId != null) {
                go(`/(hasta)/muayenelerim/${item.muayeneId}`);
              }
            }}
          >
            <Card>
              <Text style={styles.title}>
                {item.kalem?.urun_adi ?? item.baslik}
              </Text>
              <Text style={styles.meta}>
                Muayene #{item.muayeneId}
                {item.tani ? ` · ${item.tani}` : ""}
              </Text>
              {item.kalem ? (
                <Text style={styles.meta}>
                  {[item.kalem.doz, item.kalem.periyod, item.kalem.kullanim_sekli]
                    .filter(Boolean)
                    .join(" · ") || "Kullanım detayı yok"}
                </Text>
              ) : (
                <Text numberOfLines={3}>{item.receteMetin}</Text>
              )}
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
});
