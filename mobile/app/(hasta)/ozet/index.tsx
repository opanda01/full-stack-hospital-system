import { useQuery } from "@tanstack/react-query";
import { RefreshControl, ScrollView, Text, View, StyleSheet } from "react-native";
import { fetchOzetSnapshot } from "@/shared/api/hastaApi";
import { go } from "@/shared/nav";
import { queryKeys } from "@/shared/query/client";
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
  const { data, error, isLoading, isRefetching, refetch } = useQuery({
    queryKey: queryKeys.ozet,
    queryFn: fetchOzetSnapshot,
  });

  if (isLoading && !data) return <Loading />;

  const ozet = data?.ozet;
  const adSoyad =
    ozet?.ad_soyad ?? `${data?.me.ad ?? ""} ${data?.me.soyad ?? ""}`.trim();
  const r = ozet?.yaklasan_randevu;
  const yaklasan = r
    ? [
        formatTarihSaat(r.tarih_saat),
        r.departman_ad,
        r.doktor_ad_soyad,
        durumEtiket(r.durum),
      ]
        .filter(Boolean)
        .join(" · ")
    : null;
  const sonTetkik =
    ozet?.son_tetkik_turu != null
      ? [
          ozet.son_tetkik_turu,
          ozet.son_tetkik_durum ? durumEtiket(ozet.son_tetkik_durum) : null,
          ozet.son_tetkik_tarih ? formatTarihSaat(ozet.son_tetkik_tarih) : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : null;
  const badgeTetkik = ozet?.okunmamis_sonuc_sayisi ?? 0;
  const badgeRandevu = ozet?.yaklasan_randevu_sayisi ?? 0;
  const hata = error instanceof Error ? error.message : null;
  const yatis = ozet?.yatis;

  return (
    <Screen style={{ paddingBottom: 24 }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
          />
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
        {yatis?.aktif_mi ? (
          <Card>
            <Text style={styles.cardLabel}>Yatış</Text>
            <Text style={styles.cardValue}>
              {[yatis.servis_adi, yatis.yatak_no && `Yatak ${yatis.yatak_no}`]
                .filter(Boolean)
                .join(" · ") || "Aktif yatış kaydı"}
            </Text>
          </Card>
        ) : null}

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
          subtitle="Onaylı epikriz, reçete, sevk, rapor"
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
