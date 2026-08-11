import { FlatList, RefreshControl, Text, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { fetchAsilar } from "@/shared/api/hastaApi";
import { useRefetchOnTabFocus } from "@/shared/query/focus";
import { queryKeys } from "@/shared/query/client";
import {
  Card,
  EmptyText,
  ErrorText,
  Screen,
  SimpleListScreenSkeleton,
  colors,
  spacing,
  typography,
} from "@/shared/ui";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("tr-TR");
}

export default function AsilarScreen() {
  const {
    data: items = [],
    error,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: queryKeys.asilar,
    queryFn: fetchAsilar,
  });

  useRefetchOnTabFocus(refetch);

  const hata = error instanceof Error ? error.message : null;

  if (isLoading && items.length === 0) {
    return <SimpleListScreenSkeleton withHero={false} />;
  }

  return (
    <Screen>
      <Text style={styles.title}>Aşı takvimim</Text>
      <Text style={styles.sub}>Yapılan ve planlanan aşı kayıtları</Text>
      {hata ? <ErrorText>{hata}</ErrorText> : null}
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListEmptyComponent={
          !isLoading ? <EmptyText>Aşı kaydı bulunamadı.</EmptyText> : null
        }
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Text style={styles.name}>{item.asi_adi}</Text>
            <Text style={styles.meta}>
              Uygulama: {formatDate(item.uygulama_tarihi)}
            </Text>
            {item.sonraki_tarih ? (
              <Text style={styles.next}>
                Sonraki: {formatDate(item.sonraki_tarih)}
              </Text>
            ) : null}
            {item.notlar ? <Text style={styles.meta}>{item.notlar}</Text> : null}
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.titleMd,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sub: {
    ...typography.bodySm,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  list: { gap: spacing.sm, paddingBottom: spacing.xl },
  card: { marginBottom: spacing.sm },
  name: { fontWeight: "600", color: colors.text },
  meta: { color: colors.muted, marginTop: 4, fontSize: 13 },
  next: { color: colors.primary, marginTop: 4, fontSize: 13, fontWeight: "500" },
});
