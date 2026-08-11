import { FlatList, RefreshControl, Text, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { fetchAktifIlaclar } from "@/shared/api/hastaApi";
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

export default function AktifIlaclarScreen() {
  const {
    data: items = [],
    error,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: queryKeys.aktifIlaclar,
    queryFn: fetchAktifIlaclar,
  });

  useRefetchOnTabFocus(refetch);

  const hata = error instanceof Error ? error.message : null;

  if (isLoading && items.length === 0) {
    return <SimpleListScreenSkeleton withHero={false} />;
  }

  return (
    <Screen>
      <Text style={styles.title}>Aktif ilaçlarım</Text>
      <Text style={styles.sub}>
        Son muayenelerdeki reçete kalemleri (özet)
      </Text>
      {hata ? <ErrorText>{hata}</ErrorText> : null}
      <FlatList
        data={items}
        keyExtractor={(item) => item.urun_adi}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListEmptyComponent={
          !isLoading ? <EmptyText>Kayıtlı aktif ilaç bulunamadı.</EmptyText> : null
        }
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Text style={styles.drug}>{item.urun_adi}</Text>
            {item.doz ? <Text style={styles.meta}>Doz: {item.doz}</Text> : null}
            {item.periyod ? (
              <Text style={styles.meta}>Periyod: {item.periyod}</Text>
            ) : null}
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
  drug: { fontWeight: "600", color: colors.text },
  meta: { color: colors.muted, marginTop: 4, fontSize: 13 },
});
