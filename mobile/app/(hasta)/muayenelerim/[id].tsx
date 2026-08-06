import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ScrollView, Text, StyleSheet } from "react-native";
import { fetchMuayeneById } from "@/shared/api/hastaApi";
import { queryKeys } from "@/shared/query/client";
import {
  Card,
  DetailScreenSkeleton,
  ErrorText,
  Screen,
  SectionTitle,
  colors,
} from "@/shared/ui";

export default function MuayeneDetayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const mid = Number(id);

  const { data: item, error, isLoading } = useQuery({
    queryKey: queryKeys.muayene(mid),
    queryFn: () => fetchMuayeneById(mid),
    enabled: Number.isFinite(mid) && mid > 0,
  });

  const hata = !mid
    ? "Geçersiz muayene"
    : error instanceof Error
      ? error.message
      : null;

  if (isLoading && !item) return <DetailScreenSkeleton />;

  return (
    <Screen>
      <ScrollView>
        <ErrorText>{hata}</ErrorText>
        {item ? (
          <>
            <SectionTitle>Muayene #{item.id}</SectionTitle>
            <Card>
              <Text style={styles.label}>Tanı</Text>
              <Text style={styles.value}>{item.tani ?? "—"}</Text>
              <Text style={styles.label}>Tedavi planı</Text>
              <Text style={styles.value}>{item.tedavi_plani ?? "—"}</Text>
              <Text style={styles.label}>Randevu</Text>
              <Text style={styles.value}>{item.randevu_id}</Text>
            </Card>
            <SectionTitle>Reçete</SectionTitle>
            {item.recete_kalemleri?.length ? (
              item.recete_kalemleri.map((k) => (
                <Card key={k.id}>
                  <Text style={styles.title}>{k.urun_adi}</Text>
                  <Text style={styles.meta}>
                    {[k.doz, k.periyod, k.kullanim_sekli].filter(Boolean).join(" · ") ||
                      "Detay yok"}
                  </Text>
                  {k.adet != null ? <Text style={styles.meta}>Adet: {k.adet}</Text> : null}
                </Card>
              ))
            ) : (
              <Card>
                <Text style={styles.value}>{item.receteler ?? "Reçete yok"}</Text>
              </Card>
            )}
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginTop: 6 },
  value: { color: colors.text, fontSize: 15 },
  title: { fontWeight: "700", color: colors.text },
  meta: { color: colors.muted, fontSize: 13 },
});
