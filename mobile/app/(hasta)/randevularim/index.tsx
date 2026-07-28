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
import { useFocusEffect } from "expo-router";
import { apiFetch } from "@/shared/api";
import {
  Card,
  EmptyText,
  ErrorText,
  Loading,
  Screen,
  colors,
} from "@/shared/ui";

type Randevu = {
  id: string;
  tarih_saat: string;
  durum: string;
  doktor_id: number;
  departman_id: number;
  hasta_ad_soyad: string | null;
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
        <Text style={styles.calHint}>Randevulu günler nokta ile işaretli</Text>
      )}
    </View>
  );
}

export default function RandevularimScreen() {
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

  return (
    <Screen>
      <ErrorText>{hata}</ErrorText>

      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === "randevularim" && styles.tabOn]}
          onPress={() => setTab("randevularim")}
        >
          <Text
            style={[styles.tabText, tab === "randevularim" && styles.tabTextOn]}
          >
            Randevularım
          </Text>
          <View
            style={[
              styles.tabBadge,
              tab === "randevularim" && styles.tabBadgeOn,
            ]}
          >
            <Text
              style={[
                styles.tabBadgeText,
                tab === "randevularim" && styles.tabBadgeTextOn,
              ]}
            >
              {yaklasan.length}
            </Text>
          </View>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === "gecmis" && styles.tabOn]}
          onPress={() => {
            setTab("gecmis");
            setSelectedYmd(null);
          }}
        >
          <Text style={[styles.tabText, tab === "gecmis" && styles.tabTextOn]}>
            Geçmiş
          </Text>
          <View
            style={[styles.tabBadge, tab === "gecmis" && styles.tabBadgeOn]}
          >
            <Text
              style={[
                styles.tabBadgeText,
                tab === "gecmis" && styles.tabBadgeTextOn,
              ]}
            >
              {gecmis.length}
            </Text>
          </View>
        </Pressable>
      </View>

      <FlatList
        data={listData}
        keyExtractor={(i) => String(i.id)}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => void refresh()} />
        }
        onEndReached={() => void loadMore()}
        onEndReachedThreshold={0.3}
        contentContainerStyle={{ paddingBottom: 28, flexGrow: 1 }}
        ListHeaderComponent={
          tab === "randevularim" ? (
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
          ) : null
        }
        ListEmptyComponent={<EmptyText>{emptyText}</EmptyText>}
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
          return (
            <Card style={past ? styles.cardPast : undefined}>
              <Text style={styles.gun}>{gun}</Text>
              <Text style={styles.saat}>{saat || "—"}</Text>
              <Text style={styles.durum}>{durumEtiket(item.durum)}</Text>
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    marginBottom: 12,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 9,
  },
  tabOn: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.muted,
  },
  tabTextOn: {
    color: "#fff",
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.chip,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  tabBadgeOn: {
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted,
  },
  tabBadgeTextOn: {
    color: "#fff",
  },
  cal: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 8,
  },
  calHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  calTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.primary,
  },
  calNav: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  calNavText: {
    fontSize: 22,
    color: colors.primary,
    fontWeight: "700",
    marginTop: -2,
  },
  weekRow: { flexDirection: "row", marginBottom: 6 },
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
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dayToday: {
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  daySelected: {
    backgroundColor: colors.primary,
    borderWidth: 0,
  },
  dayNum: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  dayNumToday: { color: colors.accent },
  dayNumSelected: { color: "#fff" },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginTop: 2,
  },
  dotOnSelected: { backgroundColor: "#bae6fd" },
  dotSpacer: { height: 7 },
  calHint: {
    textAlign: "center",
    color: colors.muted,
    fontSize: 12,
    marginTop: 8,
  },
  clearDay: {
    alignSelf: "center",
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  clearDayText: {
    color: colors.accent,
    fontWeight: "600",
    fontSize: 13,
  },
  cardPast: { opacity: 0.85 },
  gun: {
    fontWeight: "700",
    color: colors.text,
    fontSize: 16,
    textTransform: "capitalize",
  },
  saat: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.primary,
    marginTop: 2,
  },
  durum: { color: colors.muted, fontSize: 13, marginTop: 4 },
  btn: {
    marginTop: 12,
    backgroundColor: "#fee2e2",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  btnText: { color: "#b91c1c", fontWeight: "600" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  dialog: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  dialogBody: {
    textAlign: "center",
    color: colors.primary,
    fontWeight: "600",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 4,
  },
  dialogHint: {
    textAlign: "center",
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  dialogActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  dialogCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    backgroundColor: colors.chip,
  },
  dialogCancelText: { color: colors.text, fontWeight: "600" },
  dialogConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#b91c1c",
  },
  dialogConfirmText: { color: "#fff", fontWeight: "700" },
});
