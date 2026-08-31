import { useQuery } from "@tanstack/react-query";
import {
  FlatList,
  RefreshControl,
  Text,
  StyleSheet,
  View,
} from "react-native";
import { fetchYatisGecmisi } from "@/shared/api/hastaApi";
import type { HastaYatisOzetDto } from "@/shared/api/types";
import { useRefetchOnTabFocus } from "@/shared/query/focus";
import {
  Card,
  EmptyText,
  ErrorText,
  Screen,
  SimpleListScreenSkeleton,
  colors,
  typography,
} from "@/shared/ui";

function formatTarih(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function YatisSatir({ item }: { item: HastaYatisOzetDto }) {
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.protokol}>{item.protokol_no ?? "Yatış"}</Text>
        {item.aktif_mi ? (
          <View style={styles.aktifBadge}>
            <Text style={styles.aktifText}>Aktif</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.servis}>{item.servis_adi ?? "Servis bilgisi yok"}</Text>
      <Text style={styles.meta}>
        {[
          item.oda_no && `Oda ${item.oda_no}`,
          item.yatak_no && `Yatak ${item.yatak_no}`,
        ]
          .filter(Boolean)
          .join(" · ")}
      </Text>
      <Text style={styles.tarih}>
        {formatTarih(item.yatis_tarihi)}
        {item.taburcu_tarihi
          ? ` → ${formatTarih(item.taburcu_tarihi)}`
          : " → devam ediyor"}
      </Text>
    </Card>
  );
}

export default function YatislarimScreen() {
  const { data, error, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["yatis-gecmisi"],
    queryFn: () => fetchYatisGecmisi(20),
  });

  useRefetchOnTabFocus(refetch);

  if (isLoading && !data) {
    return <SimpleListScreenSkeleton withHero={false} />;
  }

  const hata = error instanceof Error ? error.message : null;
  const items = data ?? [];

  return (
    <Screen>
      <FlatList
        data={items}
        keyExtractor={(item, i) => String(item.yatis_id ?? i)}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={typography.section}>Yatış geçmişim</Text>
            <ErrorText>{hata}</ErrorText>
          </View>
        }
        ListEmptyComponent={
          !hata ? <EmptyText>Henüz yatış kaydınız bulunmuyor.</EmptyText> : null
        }
        renderItem={({ item }) => <YatisSatir item={item} />}
        contentContainerStyle={styles.list}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 12 },
  header: { marginBottom: 8 },
  card: { marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  protokol: { fontSize: 16, fontWeight: "700", color: colors.text },
  aktifBadge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  aktifText: { fontSize: 11, fontWeight: "600", color: "#15803d" },
  servis: { marginTop: 4, fontSize: 15, color: colors.text },
  meta: { marginTop: 2, fontSize: 13, color: colors.muted },
  tarih: { marginTop: 6, fontSize: 12, color: colors.muted },
});
