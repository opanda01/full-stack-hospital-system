import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, Text, View, StyleSheet } from "react-native";
import { useFocusEffect } from "expo-router";
import { fetchOzetSnapshot } from "@/shared/api/hastaApi";
import { go } from "@/shared/nav";
import {
  Card,
  ErrorText,
  Loading,
  MenuRow,
  Screen,
  SectionTitle,
  colors,
} from "@/shared/ui";

function formatTarihSaat(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const gun = d.toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const saat = d.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${gun}, ${saat}`;
}

function durumEtiket(durum: string): string {
  if (durum === "IPTAL") return "İptal edildi";
  if (durum === "TAMAMLANDI") return "Tamamlandı";
  if (durum === "BEKLIYOR" || durum === "PLANLANDI") return "Bekliyor";
  if (durum === "SONUCLANDI") return "Sonuçlandı";
  if (durum === "ISTEK_ALINDI") return "İstek alındı";
  return durum;
}

export default function OzetScreen() {
  const [loading, setLoading] = useState(true);
  const [hata, setHata] = useState<string | null>(null);
  const [adSoyad, setAdSoyad] = useState("");
  const [yaklasan, setYaklasan] = useState<string | null>(null);
  const [sonTetkik, setSonTetkik] = useState<string | null>(null);
  const [badgeTetkik, setBadgeTetkik] = useState(0);
  const [badgeRandevu, setBadgeRandevu] = useState(0);

  const refresh = useCallback(async () => {
    setHata(null);
    try {
      const snap = await fetchOzetSnapshot();
      setAdSoyad(`${snap.me.ad} ${snap.me.soyad}`.trim());
      setYaklasan(
        snap.yaklasanRandevu
          ? `${formatTarihSaat(snap.yaklasanRandevu.tarih_saat)} · ${durumEtiket(snap.yaklasanRandevu.durum)}`
          : null,
      );
      setSonTetkik(
        snap.sonTetkik
          ? [
              snap.sonTetkik.tetkik_turu,
              durumEtiket(snap.sonTetkik.durum),
              snap.sonTetkik.created_at
                ? formatTarihSaat(snap.sonTetkik.created_at)
                : null,
            ]
              .filter(Boolean)
              .join(" · ")
          : null,
      );
      setBadgeTetkik(snap.yeniSonucSayisi);
      setBadgeRandevu(snap.yaklasanRandevuSayisi);
    } catch (e) {
      setHata(e instanceof Error ? e.message : "Özet yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void refresh();
    }, [refresh]),
  );

  if (loading) return <Loading />;

  return (
    <Screen style={{ paddingBottom: 24 }}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => void refresh()} />
        }
      >
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>Hasta Sağlık Özeti</Text>
          <Text style={styles.heroName}>{adSoyad || "Hasta"}</Text>
          <Text style={styles.heroHint}>
            Hastane kayıtlarınız — randevu, tahlil, muayene ve belgeler
          </Text>
        </View>

        <ErrorText>{hata}</ErrorText>

        <SectionTitle>Bugün</SectionTitle>
        <Card>
          <Text style={styles.cardLabel}>Yaklaşan randevu</Text>
          <Text style={styles.cardValue}>{yaklasan ?? "Yaklaşan randevu yok"}</Text>
        </Card>
        <Card>
          <Text style={styles.cardLabel}>Son tetkik</Text>
          <Text style={styles.cardValue}>{sonTetkik ?? "Tetkik kaydı yok"}</Text>
        </Card>

        <SectionTitle>Sağlık kayıtları</SectionTitle>
        <MenuRow
          title="Randevularım"
          subtitle="Liste ve iptal"
          badge={badgeRandevu}
          onPress={() => go("/(hasta)/randevularim")}
        />
        <MenuRow
          title="Randevu al"
          subtitle="Departman → doktor → saat"
          onPress={() => go("/(hasta)/randevu-al")}
        />
        <MenuRow
          title="Tahlil / tetkik sonuçları"
          subtitle="Detay ve parametreler"
          badge={badgeTetkik}
          onPress={() => go("/(hasta)/tetkik-sonuclarim")}
        />
        <MenuRow
          title="Muayenelerim"
          subtitle="Tanı ve tedavi özeti"
          onPress={() => go("/(hasta)/muayenelerim")}
        />
        <MenuRow
          title="Reçetelerim"
          subtitle="Muayene reçete kalemleri"
          onPress={() => go("/(hasta)/recetelerim")}
        />
        <MenuRow
          title="Belgelerim"
          subtitle="Onaylı epikriz"
          onPress={() => go("/(hasta)/belgelerim")}
        />
        <MenuRow
          title="Şikayet / öneri"
          subtitle="Kuruma iletin"
          onPress={() => go("/(hasta)/sikayet")}
        />
        <MenuRow
          title="Profil"
          subtitle="Kimlik ve alerjiler"
          onPress={() => go("/(hasta)/profil")}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    gap: 4,
  },
  heroEyebrow: { color: "#bae6fd", fontSize: 12, fontWeight: "600" },
  heroName: { color: "#fff", fontSize: 22, fontWeight: "700" },
  heroHint: { color: "#e0f2fe", fontSize: 13, marginTop: 4, lineHeight: 18 },
  cardLabel: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  cardValue: { color: colors.text, fontSize: 15, fontWeight: "500" },
});
