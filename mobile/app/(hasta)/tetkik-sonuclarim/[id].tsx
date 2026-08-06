import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ScrollView, Text, StyleSheet } from "react-native";
import { fetchTetkikDetayBundle } from "@/shared/api/hastaApi";
import { queryKeys } from "@/shared/query/client";
import {
  Card,
  DetailScreenSkeleton,
  ErrorText,
  Screen,
  SectionTitle,
  colors,
} from "@/shared/ui";

export default function TetkikDetayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, error, isLoading } = useQuery({
    queryKey: queryKeys.tetkik(id ?? ""),
    queryFn: () => fetchTetkikDetayBundle(id!),
    enabled: Boolean(id),
  });

  const hata = !id
    ? "Geçersiz tetkik"
    : error instanceof Error
      ? error.message
      : null;

  if (isLoading && !data) return <DetailScreenSkeleton />;

  const item = data?.item;
  const trend = data?.trend ?? [];

  return (
    <Screen>
      <ScrollView>
        <ErrorText>{hata}</ErrorText>
        {item ? (
          <>
            <SectionTitle>{item.tetkik_turu}</SectionTitle>
            <Card>
              <Text style={styles.label}>Durum</Text>
              <Text style={styles.value}>{item.durum}</Text>
              <Text style={styles.label}>Sonuç özeti</Text>
              <Text style={styles.value}>
                {item.sonuc_dosyasi ?? "Sonuç bekleniyor"}
              </Text>
            </Card>
            <SectionTitle>Parametreler</SectionTitle>
            {item.sonuc_kalemleri?.length ? (
              item.sonuc_kalemleri.map((k) => (
                <Card key={k.id}>
                  <Text style={styles.title}>
                    {k.parametre_adi}
                    {k.anormal_mi ? " ⚠" : ""}
                  </Text>
                  <Text style={styles.value}>
                    {k.deger_sayisal != null
                      ? `${k.deger_sayisal}${k.birim ? ` ${k.birim}` : ""}`
                      : (k.deger_metin ?? "—")}
                  </Text>
                  {k.ref_min != null || k.ref_max != null ? (
                    <Text style={styles.meta}>
                      Ref: {k.ref_min ?? "—"} – {k.ref_max ?? "—"}
                      {k.birim ? ` ${k.birim}` : ""}
                    </Text>
                  ) : null}
                </Card>
              ))
            ) : (
              <Card>
                <Text style={styles.meta}>Parametre kalemi yok</Text>
              </Card>
            )}
            {trend.length ? (
              <>
                <SectionTitle>Trend</SectionTitle>
                {trend.map((n, idx) => (
                  <Card key={`${n.tetkik_id}-${idx}`}>
                    <Text style={styles.meta}>{n.tarih ?? "Tarih yok"}</Text>
                    <Text style={styles.value}>
                      {n.deger_sayisal != null
                        ? `${n.deger_sayisal}${n.birim ? ` ${n.birim}` : ""}`
                        : (n.deger_metin ?? "—")}
                      {n.anormal_mi ? " ⚠" : ""}
                    </Text>
                  </Card>
                ))}
              </>
            ) : null}
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
