import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ScrollView, Text, StyleSheet } from "react-native";
import { fetchBelgeDetay } from "@/shared/api/hastaApi";
import { queryKeys } from "@/shared/query/client";
import {
  Card,
  DetailScreenSkeleton,
  ErrorText,
  Screen,
  SectionTitle,
  colors,
} from "@/shared/ui";

export default function BelgeDetayScreen() {
  const { id, kaynak } = useLocalSearchParams<{ id: string; kaynak?: string }>();
  const eid = Number(id);
  const kaynakKey = kaynak ?? "EPIKRIZ";

  const { data, error, isLoading } = useQuery({
    queryKey: queryKeys.belge(kaynakKey, eid),
    queryFn: () => fetchBelgeDetay(eid, kaynak),
    enabled: Number.isFinite(eid) && eid > 0,
  });

  const hata = !eid
    ? "Geçersiz belge"
    : error instanceof Error
      ? error.message
      : null;

  if (isLoading && !data) return <DetailScreenSkeleton />;

  const klinik = data?.klinik ?? null;
  const epikriz = data?.epikriz ?? null;

  return (
    <Screen>
      <ScrollView>
        <ErrorText>{hata}</ErrorText>
        {klinik ? (
          <>
            <SectionTitle>{klinik.tur}</SectionTitle>
            <Card>
              <Text style={styles.label}>Durum</Text>
              <Text style={styles.value}>{klinik.onay_durumu}</Text>
              <Text style={styles.label}>İçerik</Text>
              <Text style={styles.value}>{klinik.icerik}</Text>
            </Card>
          </>
        ) : null}
        {epikriz ? (
          <>
            <SectionTitle>Epikriz #{epikriz.id}</SectionTitle>
            <Card>
              <Text style={styles.label}>Durum</Text>
              <Text style={styles.value}>{epikriz.durum}</Text>
              <Text style={styles.label}>Tanı</Text>
              <Text style={styles.value}>{epikriz.tani ?? "—"}</Text>
              <Text style={styles.label}>Şikayet / öykü</Text>
              <Text style={styles.value}>{epikriz.sikayet_oyku ?? "—"}</Text>
              <Text style={styles.label}>Fizik muayene</Text>
              <Text style={styles.value}>{epikriz.fizik_muayene ?? "—"}</Text>
              <Text style={styles.label}>Tedavi özeti</Text>
              <Text style={styles.value}>{epikriz.tedavi_ozeti ?? "—"}</Text>
              <Text style={styles.label}>Taburcu önerileri</Text>
              <Text style={styles.value}>{epikriz.taburcu_onerileri ?? "—"}</Text>
            </Card>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginTop: 8 },
  value: { color: colors.text, fontSize: 15 },
});
