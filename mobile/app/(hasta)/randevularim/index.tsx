import { useCallback, useMemo, useRef, useState } from "react";
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { CalendarDays, WifiOff } from "lucide-react-native";
import { apiFetch } from "@/shared/api";
import {
  Card,
  type CardStatus,
  departmanGorsel,
  EmptyState,
  ErrorText,
  Loading,
  PageHero,
  Screen,
  SegmentControl,
  colors,
  palette,
  radius,
  spacing,
  typography,
} from "@/shared/ui";

type Randevu = {
  id: string;
  tarih_saat: string;
  durum: string;
  doktor_id: number;
  departman_id: number;
  hasta_ad_soyad: string | null;
  doktor_ad_soyad?: string | null;
  departman_ad?: string | null;
};

type Page<T> = { items: T[]; total: number; page: number; page_size: number };

type TabKey = "randevularim" | "gecmis";

const PAGE_SIZE = 100;
const WEEKDAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] as const;
const MONTHS = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
] as const;

function unwrapPage<T>(data: Page<T> | T[]): T[] {
  if (Array.isArray(data)) return data;
  return data?.items ?? [];
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseIsoDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return ymd(d);
}

function formatRandevuTarih(iso: string): { gun: string; saat: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return { gun: iso, saat: "" };
  }
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
  return { gun, saat };
}

function durumEtiket(durum: string): string {
  if (durum === "IPTAL") return "İptal edildi";
  if (durum === "TAMAMLANDI") return "Tamamlandı";
  if (durum === "BEKLIYOR" || durum === "PLANLANDI") return "Bekliyor";
  return durum;
}

function randevuStatus(durum: string, past: boolean): CardStatus {
  if (durum === "IPTAL") return "critical";
  if (!past && (durum === "BEKLIYOR" || durum === "PLANLANDI")) return "pending";
  return "normal";
}

function monthMatrix(year: number, month: number): (number | null)[][] {
  const first = new Date(year, month, 1);
  // Monday-first: Sun=0 → 6
  const startPad = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  return rows;
}

function RandevuTakvim({
  year,
  month,
  selectedYmd,
  marked,
  onPrev,
  onNext,
  onSelectDay,
}: {
  year: number;
  month: number;
  selectedYmd: string | null;
  marked: Set<string>;
  onPrev: () => void;
  onNext: () => void;
  onSelectDay: (key: string) => void;
}) {
  const todayKey = ymd(new Date());
  const rows = monthMatrix(year, month);

  return (
    <View style={styles.cal}>
      <View style={styles.calHeader}>
        <Pressable style={styles.calNav} onPress={onPrev} hitSlop={8}>
          <Text style={styles.calNavText}>‹</Text>
        </Pressable>
        <Text style={styles.calTitle}>
          {MONTHS[month]} {year}
        </Text>
        <Pressable style={styles.calNav} onPress={onNext} hitSlop={8}>
          <Text style={styles.calNavText}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((w) => (
          <Text key={w} style={styles.weekLabel}>
            {w}
          </Text>
        ))}
      </View>

      {rows.map((row, ri) => (
        <View key={ri} style={styles.dayRow}>
          {row.map((day, di) => {
            if (day == null) {
              return <View key={`e-${di}`} style={styles.dayCell} />;
            }
            const key = ymd(new Date(year, month, day));
            const isToday = key === todayKey;
            const isSelected = key === selectedYmd;
            const has = marked.has(key);
            return (
              <Pressable
                key={key}
                style={styles.dayCell}
                onPress={() => onSelectDay(key)}
              >
                <View
                  style={[
                    styles.dayInner,
                    isToday && styles.dayToday,
                    isSelected && styles.daySelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNum,
                      isSelected && styles.dayNumSelected,
                      isToday && !isSelected && styles.dayNumToday,
                    ]}
                  >
                    {day}
                  </Text>
                  {has ? (
                    <View
                      style={[
                        styles.dot,
                        isSelected ? styles.dotOnSelected : null,
                      ]}
                    />
                  ) : (
                    <View style={styles.dotSpacer} />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}

      {selectedYmd ? (
        <Pressable style={styles.clearDay} onPress={() => onSelectDay("")}>
          <Text style={styles.clearDayText}>Tüm günleri göster</Text>
        </Pressable>
      ) : (
        <View style={styles.dotSpacer} />
      )}
    </View>
  );
}

export default function RandevularimScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Randevu[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [iptalHedef, setIptalHedef] = useState<Randevu | null>(null);
  const [tab, setTab] = useState<TabKey>("randevularim");
  const loadingMoreRef = useRef(false);

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedYmd, setSelectedYmd] = useState<string | null>(null);

  const loadPage = useCallback(async (pageNum: number, append: boolean) => {
    const res = await apiFetch(
      `/randevular/?page=${pageNum}&page_size=${PAGE_SIZE}`,
    );
    if (!res.ok) {
      throw new Error("Randevular yüklenemedi");
    }
    const body = (await res.json()) as Page<Randevu>;
    const chunk = unwrapPage(body);
    setTotal(body.total ?? chunk.length);
    setPage(pageNum);
    setItems((prev) => (append ? [...prev, ...chunk] : chunk));
  }, []);

  const refresh = useCallback(async () => {
    setHata(null);
    try {
      await loadPage(1, false);
    } catch {
      setHata("Sunucuya bağlanılamadı");
    } finally {
      setLoading(false);
    }
  }, [loadPage]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void refresh();
    }, [refresh]),
  );

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || items.length >= total) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      await loadPage(page + 1, true);
    } catch {
      setHata("Daha fazla yüklenemedi");
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [items.length, loadPage, page, total]);

  const { yaklasan, gecmis } = useMemo(() => {
    const threshold = startOfDay(new Date()).getTime();
    const yak = items
      .filter((r) => new Date(r.tarih_saat).getTime() >= threshold)
      .sort(
        (a, b) =>
          new Date(a.tarih_saat).getTime() - new Date(b.tarih_saat).getTime(),
      );
    const gec = items
      .filter((r) => new Date(r.tarih_saat).getTime() < threshold)
      .sort(
        (a, b) =>
          new Date(b.tarih_saat).getTime() - new Date(a.tarih_saat).getTime(),
      );
    return { yaklasan: yak, gecmis: gec };
  }, [items]);

  const marked = useMemo(() => {
    const set = new Set<string>();
    for (const r of yaklasan) {
      const k = parseIsoDay(r.tarih_saat);
      if (k) set.add(k);
    }
    return set;
  }, [yaklasan]);

  const listData = useMemo(() => {
    const base = tab === "randevularim" ? yaklasan : gecmis;
    if (tab === "randevularim" && selectedYmd) {
      return base.filter((r) => parseIsoDay(r.tarih_saat) === selectedYmd);
    }
    return base;
  }, [tab, yaklasan, gecmis, selectedYmd]);

  const emptyText =
    tab === "randevularim"
      ? selectedYmd
        ? "Bu günde randevu yok"
        : "Yaklaşan randevu yok"
      : "Geçmiş randevu yok";

  const iptalOnayla = async () => {
    if (!iptalHedef) return;
    const id = iptalHedef.id;
    setBusyId(id);
    setHata(null);
    setIptalHedef(null);
    try {
      const res = await apiFetch(`/randevular/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setHata("İptal başarısız");
        return;
      }
      setLoading(true);
      await refresh();
    } finally {
      setBusyId(null);
    }
  };

  const shiftMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  if (loading) return <Loading />;

  const iptalTarih = iptalHedef
    ? formatRandevuTarih(iptalHedef.tarih_saat)
    : null;

  const showConnectionEmpty = Boolean(hata) && items.length === 0;

  return (
    <Screen bleed>
      {showConnectionEmpty ? (
        <View style={{ padding: spacing.lg, paddingTop: insets.top + spacing.lg }}>
        <EmptyState
          tone="error"
          icon={WifiOff}
          title="Sunucuya bağlanılamadı"
          description="Randevularınız şu an yüklenemiyor."
          actionLabel="Tekrar Dene"
          onAction={() => {
            setLoading(true);
            void refresh();
          }}
        />
        </View>
      ) : (
        <>
      <FlatList
        data={listData}
        keyExtractor={(i) => String(i.id)}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => void refresh()} />
        }
        onEndReached={() => void loadMore()}
        onEndReachedThreshold={0.3}
        contentContainerStyle={{
          paddingBottom: 28,
          flexGrow: 1,
          paddingHorizontal: spacing.lg,
        }}
        ListHeaderComponent={
          <>
            <View style={{ paddingTop: insets.top }}>
              <PageHero
                title="Randevularım"
                subtitle="Aktif ve geçmiş randevularınız"
              />
            </View>
            <ErrorText>{hata && items.length > 0 ? hata : null}</ErrorText>
            <SegmentControl
              value={tab}
              onChange={(key) => {
                setTab(key);
                if (key === "gecmis") setSelectedYmd(null);
              }}
              segments={[
                { key: "randevularim", label: "Aktif", count: yaklasan.length },
                { key: "gecmis", label: "Geçmiş", count: gecmis.length },
              ]}
            />
            {tab === "randevularim" ? (
              <RandevuTakvim
                year={viewYear}
                month={viewMonth}
                selectedYmd={selectedYmd}
                marked={marked}
                onPrev={() => shiftMonth(-1)}
                onNext={() => shiftMonth(1)}
                onSelectDay={(key) =>
                  setSelectedYmd((prev) => (!key || prev === key ? null : key))
                }
              />
            ) : null}
          </>
        }
        ListEmptyComponent={
          <EmptyState
            tone="neutral"
            icon={CalendarDays}
            title={emptyText}
            description={
              tab === "randevularim" && !selectedYmd
                ? "Yeni randevu almak için Randevu Al menüsünü kullanabilirsiniz."
                : undefined
            }
          />
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator
              color={colors.accent}
              style={{ marginVertical: 12 }}
            />
          ) : null
        }
        renderItem={({ item }) => {
          const { gun, saat } = formatRandevuTarih(item.tarih_saat);
          const iptalEdilebilir =
            item.durum !== "IPTAL" && item.durum !== "TAMAMLANDI";
          const past = tab === "gecmis";
          const dep = item.departman_ad
            ? departmanGorsel(item.departman_ad)
            : null;
          return (
            <Card
              style={[
                past ? styles.cardPast : undefined,
                !past ? styles.cardUpcoming : undefined,
              ]}
              status={randevuStatus(item.durum, past)}
            >
              <View style={styles.cardTop}>
                {dep ? (
                  <View
                    style={[
                      styles.depBadge,
                      { backgroundColor: `${dep.color}18` },
                    ]}
                  >
                    <Text style={[styles.depAbbr, { color: dep.color }]}>
                      {dep.abbr}
                    </Text>
                  </View>
                ) : null}
                <View style={{ flex: 1 }}>
                  <Text style={styles.gun}>{gun}</Text>
                  <Text style={styles.saat}>{saat || "—"}</Text>
                </View>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>
                    {past ? "Tamamlandı" : durumEtiket(item.durum)}
                  </Text>
                </View>
              </View>
              {item.departman_ad ? (
                <Text style={styles.meta}>{item.departman_ad}</Text>
              ) : null}
              {item.doktor_ad_soyad ? (
                <Text style={styles.metaMuted}>{item.doktor_ad_soyad}</Text>
              ) : null}
              {iptalEdilebilir && !past ? (
                <Pressable
                  style={styles.btn}
                  disabled={busyId === item.id}
                  onPress={() => setIptalHedef(item)}
                >
                  <Text style={styles.btnText}>
                    {busyId === item.id ? "İptal ediliyor…" : "İptal et"}
                  </Text>
                </Pressable>
              ) : null}
            </Card>
          );
        }}
      />

      <Modal
        visible={iptalHedef != null}
        transparent
        animationType="fade"
        onRequestClose={() => setIptalHedef(null)}
      >
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Randevuyu iptal et?</Text>
            {iptalTarih ? (
              <Text style={styles.dialogBody}>
                {iptalTarih.gun}
                {"\n"}
                Saat {iptalTarih.saat}
              </Text>
            ) : null}
            <Text style={styles.dialogHint}>
              Bu işlem geri alınamaz. Devam etmek istiyor musunuz?
            </Text>
            <View style={styles.dialogActions}>
              <Pressable
                style={styles.dialogCancel}
                onPress={() => setIptalHedef(null)}
              >
                <Text style={styles.dialogCancelText}>Vazgeç</Text>
              </Pressable>
              <Pressable
                style={styles.dialogConfirm}
                onPress={() => void iptalOnayla()}
              >
                <Text style={styles.dialogConfirmText}>Evet, iptal et</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cal: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md + 2,
    marginBottom: spacing.sm,
  },
  calHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  calTitle: {
    ...typography.titleMd,
    color: palette.navy800,
    fontSize: 17,
  },
  calNav: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.bosphorus50,
    alignItems: "center",
    justifyContent: "center",
  },
  calNavText: {
    fontSize: 22,
    color: palette.navy800,
    fontWeight: "700",
    marginTop: -2,
  },
  weekRow: { flexDirection: "row", marginBottom: spacing.xs + 2 },
  weekLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted,
  },
  dayRow: { flexDirection: "row", marginBottom: 2 },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
  },
  dayInner: {
    width: "100%",
    maxWidth: 40,
    aspectRatio: 1,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  dayToday: {
    borderWidth: 1.5,
    borderColor: palette.bosphorus500,
  },
  daySelected: {
    backgroundColor: palette.navy900,
    borderWidth: 0,
  },
  dayNum: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  dayNumToday: { color: palette.bosphorus500 },
  dayNumSelected: { color: palette.white },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: palette.poppy600,
    marginTop: 2,
  },
  dotOnSelected: { backgroundColor: palette.bosphorus200 },
  dotSpacer: { height: 7 },
  clearDay: {
    alignSelf: "center",
    marginTop: spacing.sm,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
  },
  clearDayText: {
    color: palette.bosphorus500,
    fontWeight: "600",
    fontSize: 13,
  },
  cardPast: { opacity: 0.75 },
  cardUpcoming: { borderColor: "#BFDBFE" },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  depBadge: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  depAbbr: { fontSize: 12, fontWeight: "800" },
  statusPill: {
    backgroundColor: palette.bosphorus50,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: palette.bosphorus500,
  },
  gun: {
    fontWeight: "700",
    color: colors.text,
    fontSize: 16,
    textTransform: "capitalize",
  },
  saat: {
    ...typography.dataLg,
    color: palette.navy800,
    marginTop: 2,
  },
  meta: { color: colors.text, fontSize: 15, fontWeight: "700", marginTop: 2 },
  metaMuted: { color: colors.muted, fontSize: 13, marginTop: 2 },
  btn: {
    marginTop: spacing.md,
    backgroundColor: palette.poppy100,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.sm,
    alignItems: "center",
  },
  btnText: { color: palette.poppy600, fontWeight: "600" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  dialog: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: palette.white,
    borderRadius: radius.lg,
    padding: spacing.lg + 4,
    gap: spacing.sm,
  },
  dialogTitle: {
    ...typography.titleMd,
    textAlign: "center",
  },
  dialogBody: {
    textAlign: "center",
    color: palette.navy800,
    fontWeight: "600",
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.xs,
  },
  dialogHint: {
    textAlign: "center",
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  dialogActions: { flexDirection: "row", gap: spacing.sm + 2, marginTop: spacing.xs },
  dialogCancel: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.sm + 2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    backgroundColor: colors.chip,
  },
  dialogCancelText: { color: colors.text, fontWeight: "600" },
  dialogConfirm: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.sm + 2,
    alignItems: "center",
    backgroundColor: palette.poppy600,
  },
  dialogConfirmText: { color: palette.white, fontWeight: "700" },
});
