import { useCallback, useMemo, useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  FlaskConical,
  WifiOff,
} from "lucide-react-native";
import { fetchTetkikler } from "@/shared/api/hastaApi";
import type { TetkikDto, TetkikSonucKalemDto } from "@/shared/api/types";
import { go } from "@/shared/nav";
import { useRefetchOnTabFocus } from "@/shared/query/focus";
import { queryKeys } from "@/shared/query/client";
import {
  Card,
  type CardStatus,
  EmptyState,
  PageHero,
  Screen,
  TetkikScreenSkeleton,
  colors,
  palette,
  radius,
  shadows,
  spacing,
  typography,
} from "@/shared/ui";

type IstekGrubu = {
  key: string;
  doktorId: number;
  label: string;
  items: TetkikDto[];
};

type TarihGrubu = {
  key: string;
  label: string;
  sortKey: string;
  istekler: IstekGrubu[];
  toplam: number;
};

function tarihKey(iso: string | null | undefined): string {
  if (!iso) return "bilinmeyen";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "bilinmeyen";
  return d.toISOString().slice(0, 10);
}

function tarihLabel(key: string): string {
  if (key === "bilinmeyen") return "Tarih bilinmiyor";
  const d = new Date(`${key}T12:00:00`);
  return d.toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function durumEtiket(durum: string): string {
  if (durum === "SONUCLANDI") return "Sonuçlandı";
  if (durum === "ISTEK_ALINDI") return "İstek alındı";
  return durum;
}

function tetkikStatus(t: TetkikDto): CardStatus {
  if (t.durum !== "SONUCLANDI") return "pending";
  if (t.sonuc_kalemleri?.some((k) => k.anormal_mi)) return "critical";
  return "normal";
}

function formatKalemDeger(k: TetkikSonucKalemDto): string {
  if (k.deger_sayisal != null) {
    return `${k.deger_sayisal}${k.birim ? ` ${k.birim}` : ""}`;
  }
  return k.deger_metin ?? "—";
}

function groupTetkikler(items: TetkikDto[]): TarihGrubu[] {
  const byDate = new Map<string, TetkikDto[]>();
  for (const t of items) {
    const k = tarihKey(t.created_at);
    const list = byDate.get(k) ?? [];
    list.push(t);
    byDate.set(k, list);
  }

  const groups: TarihGrubu[] = [];
  for (const [key, list] of byDate.entries()) {
    const byDoktor = new Map<number, TetkikDto[]>();
    for (const t of list) {
      const dList = byDoktor.get(t.istek_yapan_doktor_id) ?? [];
      dList.push(t);
      byDoktor.set(t.istek_yapan_doktor_id, dList);
    }
    const istekler: IstekGrubu[] = [...byDoktor.entries()].map(
      ([doktorId, dokItems]) => ({
        key: `${key}-d${doktorId}`,
        doktorId,
        label: `İstek grubu · Doktor #${doktorId}`,
        items: dokItems,
      }),
    );
    groups.push({
      key,
      label: tarihLabel(key),
      sortKey: key === "bilinmeyen" ? "0000-00-00" : key,
      istekler,
      toplam: list.length,
    });
  }

  return groups.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
}

export default function TetkikSonuclarimScreen() {
  const insets = useSafeAreaInsets();
  const [openDate, setOpenDate] = useState<string | null>(null);
  const [openIstek, setOpenIstek] = useState<string | null>(null);

  const {
    data: items = [],
    error,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: queryKeys.tetkikler,
    queryFn: async () => {
      const body = await fetchTetkikler(1, 100);
      return body.items;
    },
  });

  useRefetchOnTabFocus(refetch);

  const hata = error instanceof Error ? error.message : null;
  const groups = useMemo(() => groupTetkikler(items), [items]);

  const onRefresh = useCallback(() => {
    setOpenDate(null);
    setOpenIstek(null);
    void refetch();
  }, [refetch]);

  if (isLoading && items.length === 0) return <TetkikScreenSkeleton />;

  if (hata && groups.length === 0) {
    return (
      <Screen>
        <EmptyState
          tone="error"
          icon={WifiOff}
          title="Sunucuya bağlanılamadı"
          description="Tetkik sonuçları şu an yüklenemiyor. İnternet bağlantınızı kontrol edip tekrar deneyin."
          actionLabel="Tekrar Dene"
          onAction={() => void refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen bleed>
      <FlatList
        data={groups}
        keyExtractor={(g) => g.key}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <>
            <View style={{ paddingTop: insets.top }}>
              <PageHero
                title="Tahlil sonuçları"
                subtitle="Laboratuvar ve tetkik raporları"
              />
            </View>
            {hata ? (
              <View style={{ paddingHorizontal: spacing.lg }}>
                <EmptyState
                  tone="error"
                  icon={WifiOff}
                  title="Bağlantı sorunu"
                  description={hata}
                  actionLabel="Tekrar Dene"
                  onAction={() => void refetch()}
                />
              </View>
            ) : null}
          </>
        }
        ListEmptyComponent={
          <EmptyState
            tone="neutral"
            icon={FlaskConical}
            title="Tetkik sonucu yok"
            description="Henüz kayıtlı tetkik veya sonuç bulunmuyor."
          />
        }
        contentContainerStyle={{
          paddingBottom: spacing.xl,
          flexGrow: 1,
          paddingHorizontal: spacing.lg,
        }}
        renderItem={({ item: gun }) => {
          const dateOpen = openDate === gun.key;
          return (
            <View style={styles.block}>
              <Pressable
                style={[styles.dateHeader, dateOpen && styles.dateHeaderOpen]}
                onPress={() => {
                  setOpenDate(dateOpen ? null : gun.key);
                  setOpenIstek(null);
                }}
              >
                <Calendar size={18} color={palette.bosphorus500} strokeWidth={2} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.dateTitle}>{gun.label}</Text>
                  <Text style={styles.dateMeta}>{gun.toplam} kalem</Text>
                </View>
                {dateOpen ? (
                  <ChevronDown size={20} color={palette.slate400} />
                ) : (
                  <ChevronRight size={20} color={palette.slate400} />
                )}
              </Pressable>

              {dateOpen
                ? gun.istekler.map((istek) => {
                    const istekOpen = openIstek === istek.key;
                    return (
                      <View key={istek.key} style={styles.istekWrap}>
                        <Pressable
                          style={styles.istekHeader}
                          onPress={() =>
                            setOpenIstek(istekOpen ? null : istek.key)
                          }
                        >
                          <FlaskConical size={16} color={palette.navy800} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.istekTitle}>{istek.label}</Text>
                            <Text style={styles.dateMetaDark}>
                              {istek.items.length} kalem
                            </Text>
                          </View>
                          {istekOpen ? (
                            <ChevronDown size={18} color={colors.muted} />
                          ) : (
                            <ChevronRight size={18} color={colors.muted} />
                          )}
                        </Pressable>
                        {istekOpen
                          ? istek.items.map((t) => {
                              const status = tetkikStatus(t);
                              const ilkKalem = t.sonuc_kalemleri?.[0];
                              return (
                                <Pressable
                                  key={t.id}
                                  onPress={() =>
                                    go(`/(hasta)/tetkik-sonuclarim/${t.id}`)
                                  }
                                >
                                  <Card status={status} style={styles.itemCard}>
                                    <View style={styles.cardTitleRow}>
                                      <FlaskConical
                                        size={16}
                                        color={
                                          status === "critical"
                                            ? palette.poppy600
                                            : palette.navy800
                                        }
                                      />
                                      <Text style={styles.cardTitle}>
                                        {t.tetkik_turu}
                                      </Text>
                                    </View>
                                    <Text style={typography.bodySm}>
                                      {durumEtiket(t.durum)}
                                    </Text>
                                    {ilkKalem ? (
                                      <>
                                        <Text style={typography.dataLg}>
                                          {formatKalemDeger(ilkKalem)}
                                        </Text>
                                        {ilkKalem.ref_min != null ||
                                        ilkKalem.ref_max != null ? (
                                          <Text style={typography.bodySm}>
                                            Ref: {ilkKalem.ref_min ?? "—"} –{" "}
                                            {ilkKalem.ref_max ?? "—"}
                                            {ilkKalem.birim
                                              ? ` ${ilkKalem.birim}`
                                              : ""}
                                          </Text>
                                        ) : null}
                                      </>
                                    ) : (
                                      <Text style={typography.bodySm} numberOfLines={1}>
                                        {t.sonuc_dosyasi ?? "Sonuç bekleniyor"}
                                      </Text>
                                    )}
                                  </Card>
                                </Pressable>
                              );
                            })
                          : null}
                      </View>
                    );
                  })
                : null}
            </View>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { marginBottom: spacing.sm + 2 },
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.md + 2,
    gap: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.cardSoft,
  },
  dateHeaderOpen: {
    borderBottomLeftRadius: spacing.sm,
    borderBottomRightRadius: spacing.sm,
  },
  dateTitle: { color: palette.ink, fontWeight: "700", fontSize: 15 },
  dateMeta: { color: palette.slate400, fontSize: 12, marginTop: 2 },
  dateMetaDark: { color: colors.muted, fontSize: 12, marginTop: 2 },
  istekWrap: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopWidth: 0,
    paddingHorizontal: spacing.sm + 2,
    paddingBottom: spacing.sm,
    borderBottomLeftRadius: radius.md,
    borderBottomRightRadius: radius.md,
  },
  istekHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  istekTitle: { fontWeight: "600", color: colors.text },
  itemCard: { marginTop: spacing.sm, marginBottom: 0 },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  cardTitle: { fontWeight: "700", color: colors.text, flex: 1 },
});
