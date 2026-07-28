import { useCallback, useState } from "react";
import { ScrollView, Text, StyleSheet } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { fetchTetkik, fetchTetkikTrend } from "@/shared/api/hastaApi";
import type { TetkikDto, TetkikTrendNoktaDto } from "@/shared/api/types";
import { Card, ErrorText, Loading, Screen, SectionTitle, colors } from "@/shared/ui";

export default function TetkikDetayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<TetkikDto | null>(null);
  const [trend, setTrend] = useState<TetkikTrendNoktaDto[]>([]);
  const [hata, setHata] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!id) {
        setHata("Geçersiz tetkik");
        setLoading(false);
        return;
      }
      setLoading(true);
      setHata(null);
      (async () => {
        try {
          const t = await fetchTetkik(id);
          setItem(t);
          const firstParam = t.sonuc_kalemleri?.find((k) => k.parametre_adi)?.parametre_adi;
          if (firstParam && t.hasta_id) {
            try {
              setTrend(await fetchTetkikTrend(t.hasta_id, firstParam));
            } catch {
              setTrend([]);
            }
          } else {
            setTrend([]);
          }
        } catch (e) {
          setHata(e instanceof Error ? e.message : "Yüklenemedi");
        } finally {
          setLoading(false);
        }
      })();
    }, [id]),
  );

  if (loading) return <Loading />;

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
