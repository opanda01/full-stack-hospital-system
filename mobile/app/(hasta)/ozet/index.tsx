import { useQuery } from "@tanstack/react-query";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Calendar,
  ClipboardList,
  FileText,
  FlaskConical,
  MessageSquare,
  Pill,
  Stethoscope,
  User,
} from "lucide-react-native";
import { fetchOzetSnapshot } from "@/shared/api/hastaApi";
import { go } from "@/shared/nav";
import { useRefetchOnTabFocus } from "@/shared/query/focus";
import { queryKeys } from "@/shared/query/client";
import {
  Badge,
  Card,
  departmanGorsel,
  ErrorText,
  MenuRow,
  OzetScreenSkeleton,
  QuickActionTile,
  Screen,
  palette,
  radius,
  shadows,
  spacing,
  typography,
} from "@/shared/ui";

function formatTarihSaat(iso: string): { tarih: string; saat: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { tarih: iso, saat: "" };
  return {
    tarih: d.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    saat: d.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

function durumEtiket(durum: string): string {
  if (durum === "IPTAL") return "İptal edildi";
  if (durum === "TAMAMLANDI") return "Tamamlandı";
  if (durum === "BEKLIYOR" || durum === "PLANLANDI") return "Bekliyor";
  if (durum === "SONUCLANDI") return "Sonuçlandı";
  if (durum === "ISTEK_ALINDI") return "İstek alındı";
  return durum;
}

function sonTetkikBadge(durum: string | null | undefined): "success" | "warning" | "neutral" {
  if (durum === "SONUCLANDI") return "success";
  if (durum) return "warning";
  return "neutral";
}

export default function OzetScreen() {
  const insets = useSafeAreaInsets();
  const { data, error, isLoading, isRefetching, refetch } = useQuery({
    queryKey: queryKeys.ozet,
    queryFn: fetchOzetSnapshot,
  });

  useRefetchOnTabFocus(refetch);

  if (isLoading && !data) return <OzetScreenSkeleton />;

  const ozet = data?.ozet;
  const adSoyad =
    ozet?.ad_soyad ?? `${data?.me.ad ?? ""} ${data?.me.soyad ?? ""}`.trim();
  const r = ozet?.yaklasan_randevu;
  const badgeTetkik = ozet?.okunmamis_sonuc_sayisi ?? 0;
  const badgeRandevu = ozet?.yaklasan_randevu_sayisi ?? 0;
  const hata = error instanceof Error ? error.message : null;
  const yatis = ozet?.yatis;

  const randevuZaman = r ? formatTarihSaat(r.tarih_saat) : null;
  const depGorsel = r?.departman_ad ? departmanGorsel(r.departman_ad) : null;

  return (
    <Screen bleed style={{ paddingBottom: spacing.xl }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
          />
        }
        contentContainerStyle={{ paddingBottom: spacing.xl }}
      >
        <View style={[styles.hero, { paddingTop: insets.top + spacing.lg }]}>
          <View style={styles.heroOrbLg} />
          <View style={styles.heroOrbSm} />
          <Text style={styles.heroEyebrow}>Hoş geldiniz</Text>
          <Text style={styles.heroName}>{adSoyad || "Hasta"}</Text>
        </View>

        <View style={styles.body}>
          <ErrorText>{hata}</ErrorText>

          {r && randevuZaman ? (
            <Card style={styles.upcomingCard}>
              <View style={styles.upcomingHead}>
                <Text style={styles.upcomingLabel}>Yaklaşan randevu</Text>
                <View style={styles.datePill}>
                  <Text style={styles.datePillText}>{randevuZaman.tarih}</Text>
                </View>
              </View>
              <View style={styles.upcomingRow}>
                {depGorsel ? (
                  <View
                    style={[
                      styles.depBadge,
                      { backgroundColor: `${depGorsel.color}18` },
                    ]}
                  >
                    <Text style={[styles.depAbbr, { color: depGorsel.color }]}>
                      {depGorsel.abbr}
                    </Text>
                  </View>
                ) : null}
                <View style={{ flex: 1 }}>
                  <Text style={styles.upcomingDept}>
                    {r.departman_ad ?? "Randevu"}
                  </Text>
                  {r.doktor_ad_soyad ? (
                    <Text style={styles.upcomingDoc}>{r.doktor_ad_soyad}</Text>
                  ) : null}
                  <Text style={styles.upcomingStatus}>
                    {durumEtiket(r.durum)}
                  </Text>
                </View>
                <View style={styles.timeCol}>
                  <Text style={styles.timeBig}>{randevuZaman.saat}</Text>
                </View>
              </View>
              <View style={styles.upcomingActions}>
                <Pressable
                  style={styles.btnPrimary}
                  onPress={() => go("/(hasta)/randevularim")}
                >
                  <Text style={styles.btnPrimaryText}>Detay gör</Text>
                </Pressable>
                <Pressable
                  style={styles.btnDangerSoft}
                  onPress={() => go("/(hasta)/randevularim")}
                >
                  <Text style={styles.btnDangerText}>İptal et</Text>
                </Pressable>
              </View>
            </Card>
          ) : (
            <Card>
              <Text style={styles.cardLabel}>Yaklaşan randevu</Text>
              <Text style={styles.cardMuted}>Yaklaşan randevu yok</Text>
            </Card>
          )}

          {ozet?.son_tetkik_turu ? (
            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <Text style={typography.section}>Son tahlil</Text>
                <Pressable onPress={() => go("/(hasta)/tetkik-sonuclarim")}>
                  <Text style={styles.link}>Tümünü gör</Text>
                </Pressable>
              </View>
              <Pressable onPress={() => go("/(hasta)/tetkik-sonuclarim")}>
                <Card style={styles.tetkikPreview}>
                  <View style={styles.tetkikHead}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.tetkikTitle}>{ozet.son_tetkik_turu}</Text>
                      {ozet.son_tetkik_tarih ? (
                        <Text style={styles.cardMuted}>
                          {formatTarihSaat(ozet.son_tetkik_tarih).tarih}
                        </Text>
                      ) : null}
                    </View>
                    <Badge
                      kind={sonTetkikBadge(ozet.son_tetkik_durum)}
                      label={durumEtiket(ozet.son_tetkik_durum ?? "")}
                    />
                  </View>
                </Card>
              </Pressable>
            </View>
          ) : null}

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

          <Text style={[typography.section, styles.quickTitle]}>Hızlı işlemler</Text>
          <View style={styles.quickGrid}>
            <QuickActionTile
              label="Randevu Al"
              sub="Doktor & klinik seç"
              bg={palette.bosphorus50}
              accent={palette.bosphorus500}
              icon={Calendar}
              onPress={() => go("/(hasta)/randevu-al")}
            />
            <QuickActionTile
              label="Tahlil sonuçları"
              sub="Lab raporlarını gör"
              bg={palette.green100}
              accent={palette.green700}
              icon={FlaskConical}
              onPress={() => go("/(hasta)/tetkik-sonuclarim")}
            />
            <QuickActionTile
              label="Randevularım"
              sub="Geçmiş ve aktif"
              bg={palette.amber100}
              accent={palette.amber700}
              icon={Calendar}
              onPress={() => go("/(hasta)/randevularim")}
            />
            <QuickActionTile
              label="Profilim"
              sub="Sağlık bilgileri"
              bg="#FAF5FF"
              accent="#7C3AED"
              icon={User}
              onPress={() => go("/(hasta)/profil")}
            />
          </View>

          <View style={styles.menuSection}>
            <Text style={[typography.section, styles.quickTitle]}>Sağlık kayıtları</Text>
            <MenuRow
              title="Randevularım"
              subtitle="Liste ve iptal"
              badge={badgeRandevu}
              icon={Calendar}
              onPress={() => go("/(hasta)/randevularim")}
            />
            <MenuRow
              title="Tahlil / tetkik sonuçları"
              subtitle="Detay ve parametreler"
              badge={badgeTetkik}
              icon={FlaskConical}
              onPress={() => go("/(hasta)/tetkik-sonuclarim")}
            />
            <MenuRow
              title="Muayenelerim"
              subtitle="Tanı ve tedavi özeti"
              icon={Stethoscope}
              onPress={() => go("/(hasta)/muayenelerim")}
            />
            <MenuRow
              title="Reçetelerim"
              subtitle="Muayene reçete kalemleri"
              icon={Pill}
              onPress={() => go("/(hasta)/recetelerim")}
            />
            <MenuRow
              title="Belgelerim"
              subtitle="Onaylı epikriz, reçete, sevk, rapor"
              icon={FileText}
              onPress={() => go("/(hasta)/belgelerim")}
            />
            <MenuRow
              title="Şikayet / öneri"
              subtitle="Kuruma iletin"
              icon={MessageSquare}
              onPress={() => go("/(hasta)/sikayet")}
            />
            <MenuRow
              title="Profil"
              subtitle="Kimlik ve alerjiler"
              icon={ClipboardList}
              onPress={() => go("/(hasta)/profil")}
            />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: palette.navy900,
    paddingHorizontal: spacing.lg + 4,
    paddingBottom: spacing.xl + 4,
    overflow: "hidden",
  },
  heroOrbLg: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  heroOrbSm: {
    position: "absolute",
    top: 20,
    right: 60,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  heroEyebrow: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "500",
  },
  heroName: {
    color: palette.white,
    fontSize: 22,
    fontWeight: "800",
    marginTop: spacing.xs,
  },
  tcRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.sm,
  },
  tcDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4ADE80",
  },
  heroTc: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  upcomingCard: {
    borderColor: "rgba(29,111,164,0.08)",
    ...shadows.card,
  },
  upcomingHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  upcomingLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.bosphorus500,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  datePill: {
    backgroundColor: palette.bosphorus50,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  datePillText: {
    fontSize: 11,
    fontWeight: "600",
    color: palette.bosphorus500,
  },
  upcomingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  depBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  depAbbr: { fontSize: 13, fontWeight: "800" },
  upcomingDept: { fontSize: 15, fontWeight: "700", color: palette.ink },
  upcomingDoc: { fontSize: 13, color: palette.slate600, marginTop: 2 },
  upcomingStatus: { fontSize: 12, color: palette.slate400, marginTop: 4 },
  timeCol: { alignItems: "flex-end" },
  timeBig: { fontSize: 16, fontWeight: "800", color: palette.navy900 },
  upcomingActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: palette.lineSoft,
  },
  btnPrimary: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: palette.navy900,
    alignItems: "center",
  },
  btnPrimaryText: { color: palette.white, fontSize: 13, fontWeight: "600" },
  btnDangerSoft: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: palette.poppy100,
    alignItems: "center",
  },
  btnDangerText: { color: palette.poppy600, fontSize: 13, fontWeight: "600" },
  cardLabel: { ...typography.label },
  cardMuted: { ...typography.bodySm, marginTop: 2 },
  cardValue: { ...typography.body, fontWeight: "500" },
  section: { marginTop: spacing.lg },
  sectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm + 2,
  },
  link: { fontSize: 12, fontWeight: "600", color: palette.bosphorus500 },
  tetkikPreview: { marginBottom: 0 },
  tetkikHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  tetkikTitle: { fontSize: 14, fontWeight: "700", color: palette.ink },
  quickTitle: { marginTop: spacing.lg, marginBottom: spacing.sm + 2 },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm + 2,
  },
  menuSection: { marginTop: spacing.md },
});
