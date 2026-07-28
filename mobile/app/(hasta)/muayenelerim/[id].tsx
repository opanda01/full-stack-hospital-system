import { useCallback, useState } from "react";
import { ScrollView, Text, StyleSheet } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { fetchMuayeneById } from "@/shared/api/hastaApi";
import type { MuayeneDto } from "@/shared/api/types";
import { Card, ErrorText, Loading, Screen, SectionTitle, colors } from "@/shared/ui";

export default function MuayeneDetayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<MuayeneDto | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const mid = Number(id);
      if (!mid) {
        setHata("Geçersiz muayene");
        setLoading(false);
        return;
      }
      setLoading(true);
      setHata(null);
      (async () => {
        try {
          setItem(await fetchMuayeneById(mid));
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
