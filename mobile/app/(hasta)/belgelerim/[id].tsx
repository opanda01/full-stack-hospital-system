import { useCallback, useState } from "react";
import { ScrollView, Text, StyleSheet } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { apiFetch } from "@/shared/api";
import { fetchEpikriz } from "@/shared/api/hastaApi";
import type { EpikrizDto, KlinikOnayDto } from "@/shared/api/types";
import { Card, ErrorText, Loading, Screen, SectionTitle, colors } from "@/shared/ui";

async function fetchKlinikOnay(id: number): Promise<KlinikOnayDto> {
  const res = await apiFetch(`/klinik-onay/${id}`);
  if (!res.ok) throw new Error("Belge yüklenemedi");
  return res.json();
}

export default function BelgeDetayScreen() {
  const { id, kaynak } = useLocalSearchParams<{ id: string; kaynak?: string }>();
  const [epikriz, setEpikriz] = useState<EpikrizDto | null>(null);
  const [klinik, setKlinik] = useState<KlinikOnayDto | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const eid = Number(id);
      if (!eid) {
        setHata("Geçersiz belge");
        setLoading(false);
        return;
      }
      setLoading(true);
      setHata(null);
      (async () => {
        try {
          if (kaynak === "KLINIK_ONAY") {
            setKlinik(await fetchKlinikOnay(eid));
            setEpikriz(null);
          } else {
            setEpikriz(await fetchEpikriz(eid));
            setKlinik(null);
          }
        } catch (e) {
          setHata(e instanceof Error ? e.message : "Yüklenemedi");
        } finally {
          setLoading(false);
        }
      })();
    }, [id, kaynak]),
  );

  if (loading) return <Loading />;

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
