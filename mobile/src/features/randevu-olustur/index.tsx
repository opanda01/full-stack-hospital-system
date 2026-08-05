import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  SectionList,
  FlatList,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { LucideIcon } from "lucide-react-native";
import {
  Activity,
  Baby,
  Bone,
  Brain,
  Check,
  Eye,
  Heart,
  Hospital,
  Scissors,
  Search,
  Stethoscope,
} from "lucide-react-native";
import { apiFetch } from "@/shared/api";
import { go } from "@/shared/nav";
import {
  EmptyState,
  ErrorText,
  PageHero,
  PrimaryButton,
  Screen,
  SectionHeader,
  colors,
  palette,
  radius,
  shadows,
  spacing,
  typography,
} from "@/shared/ui";

type Departman = { id: number; ad: string };
type Doktor = {
  id: number;
  uzmanlik_alani: string;
  ad: string | null;
  soyad: string | null;
  departman_id: number | null;
  online_randevu_acik_mi: boolean;
};
type Hasta = { id: string };

type Step = 1 | 2 | 3;

type DepKategori = "dahili" | "cerrahi" | "acil" | "diger";

const KATEGORI_LABEL: Record<DepKategori, string> = {
  dahili: "Dahili Birimler",
  cerrahi: "Cerrahi Birimler",
  acil: "Acil / Yoğun Bakım",
  diger: "Diğer",
};

const KATEGORI_ICON: Record<DepKategori, LucideIcon> = {
  dahili: Stethoscope,
  cerrahi: Scissors,
  acil: Activity,
  diger: Hospital,
};

function departmanKategori(ad: string): DepKategori {
  const q = ad.toLocaleLowerCase("tr-TR");
  if (/(acil|yoğun|yogun|anestezi|reanimasyon)/.test(q)) return "acil";
  if (
    /(cerrahi|ortoped|üroloji|uroloji|kbb|göz|goz|plastik|kalp ve damar|beyin|genel cerrahi|çocuk cerrahi)/.test(
      q,
    )
  )
    return "cerrahi";
  if (
    /(dahili|kardiyo|nöro|noro|gastro|endokrin|göğüs|gogus|hematoloji|onkoloji|enfeksiyon|nefro|romat|dermatoloji|psikiyatri|fizik tedavi|dahiliye|iç hastalık|ic hastalik)/.test(
      q,
    )
  )
    return "dahili";
  return "diger";
}

function departmanIcon(ad: string): LucideIcon {
  const q = ad.toLocaleLowerCase("tr-TR");
  if (q.includes("kardiyo")) return Heart;
  if (q.includes("ortoped") || q.includes("kemik")) return Bone;
  if (q.includes("göz") || q.includes("goz")) return Eye;
  if (q.includes("nöro") || q.includes("noro") || q.includes("beyin")) return Brain;
  if (q.includes("çocuk") || q.includes("cocuk") || q.includes("pediatri"))
    return Baby;
  if (q.includes("acil")) return Activity;
  return Stethoscope;
}

function tomorrowYmd(): string {
  const tarih = new Date();
  tarih.setDate(tarih.getDate() + 1);
  return tarih.toISOString().slice(0, 10);
}

function formatSlot(iso: string): string {
  return new Date(iso).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function doktorAdi(d: Doktor): string {
  return [d.ad, d.soyad].filter(Boolean).join(" ") || `Doktor #${d.id}`;
}

function StepDots({ step }: { step: Step }) {
  return (
    <View style={styles.dots}>
      {([1, 2, 3] as Step[]).map((n) => (
        <View key={n} style={[styles.dot, step >= n && styles.dotActive]} />
      ))}
      <Text style={styles.dotLabel}>
        {step === 1 ? "Departman" : step === 2 ? "Doktor" : "Saat"}
      </Text>
    </View>
  );
}

function SelectRow({
  title,
  subtitle,
  selected,
  onPress,
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
  icon?: LucideIcon;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, selected && styles.rowSelected]}
    >
      {Icon ? (
        <View style={[styles.rowIcon, selected && styles.rowIconSelected]}>
          <Icon
            size={20}
            color={selected ? palette.white : palette.navy800}
            strokeWidth={2}
          />
        </View>
      ) : null}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.rowTitle, selected && styles.rowTitleSelected]}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.rowSub, selected && styles.rowSubSelected]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {selected ? (
        <View style={styles.check}>
          <Check size={14} color={palette.white} strokeWidth={3} />
        </View>
      ) : (
        <View style={styles.checkPlaceholder} />
      )}
    </Pressable>
  );
}

export function RandevuOlusturForm() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>(1);
  const [departmanlar, setDepartmanlar] = useState<Departman[]>([]);
  const [doktorlar, setDoktorlar] = useState<Doktor[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [depId, setDepId] = useState<number | null>(null);
  const [doktorId, setDoktorId] = useState<number | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [hastaId, setHastaId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [poliklinikAra, setPoliklinikAra] = useState("");

  const selectedDep = useMemo(
    () => departmanlar.find((d) => d.id === depId) ?? null,
    [departmanlar, depId],
  );
  const filteredDepartmanlar = useMemo(() => {
    const q = poliklinikAra.trim().toLocaleLowerCase("tr-TR");
    if (!q) return departmanlar;
    return departmanlar.filter((d) =>
      d.ad.toLocaleLowerCase("tr-TR").includes(q),
    );
  }, [departmanlar, poliklinikAra]);

  const departmanSections = useMemo(() => {
    const order: DepKategori[] = ["dahili", "cerrahi", "acil", "diger"];
    const buckets = new Map<DepKategori, Departman[]>();
    for (const d of filteredDepartmanlar) {
      const k = departmanKategori(d.ad);
      const arr = buckets.get(k) ?? [];
      arr.push(d);
      buckets.set(k, arr);
    }
    return order
      .filter((k) => (buckets.get(k)?.length ?? 0) > 0)
      .map((k) => ({
        key: k,
        title: KATEGORI_LABEL[k],
        icon: KATEGORI_ICON[k],
        data: buckets.get(k) ?? [],
      }));
  }, [filteredDepartmanlar]);
  const filteredDoktorlar = useMemo(
    () =>
      doktorlar.filter(
        (d) => d.departman_id === depId && d.online_randevu_acik_mi !== false,
      ),
    [doktorlar, depId],
  );
  const selectedDoktor = useMemo(
    () => filteredDoktorlar.find((d) => d.id === doktorId) ?? null,
    [filteredDoktorlar, doktorId],
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      setHata(null);
      try {
        const [hRes, dRes, dokRes] = await Promise.all([
          apiFetch("/hastalar/ben"),
          apiFetch("/departmanlar/"),
          apiFetch("/doktorlar/?page_size=200"),
        ]);
        if (!hRes.ok) throw new Error("Hasta kaydı alınamadı");
        if (!dRes.ok) throw new Error("Departmanlar yüklenemedi");
        if (!dokRes.ok) throw new Error("Doktorlar yüklenemedi");
        const mine = (await hRes.json()) as Hasta;
        setHastaId(mine.id);
        setDepartmanlar(await dRes.json());
        const dokBody = await dokRes.json();
        setDoktorlar(Array.isArray(dokBody) ? dokBody : (dokBody.items ?? []));
      } catch (e) {
        setHata(e instanceof Error ? e.message : "Veriler yüklenemedi");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!doktorId) {
      setSlots([]);
      setSlot(null);
      return;
    }
    const ymd = tomorrowYmd();
    (async () => {
      setSlotsLoading(true);
      setHata(null);
      try {
        const res = await apiFetch(
          `/randevular/musait?doktor_id=${doktorId}&tarih=${ymd}`,
        );
        if (!res.ok) {
          setHata("Müsait slotlar alınamadı");
          setSlots([]);
          return;
        }
        setSlots(await res.json());
      } finally {
        setSlotsLoading(false);
      }
    })();
  }, [doktorId]);

  const resetAll = () => {
    setStep(1);
    setDepId(null);
    setDoktorId(null);
    setSlot(null);
    setSlots([]);
    setMsg(null);
    setHata(null);
    setPoliklinikAra("");
  };

  const olustur = async () => {
    if (!depId || !doktorId || !slot || !hastaId) {
      setHata("Eksik seçim");
      return;
    }
    setSubmitting(true);
    setMsg(null);
    setHata(null);
    try {
      const res = await apiFetch("/randevular/", {
        method: "POST",
        body: JSON.stringify({
          hasta_id: hastaId,
          doktor_id: doktorId,
          departman_id: depId,
          tarih_saat: slot,
          notlar: null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setHata(
          typeof body.detail === "string"
            ? body.detail
            : "Randevu oluşturulamadı",
        );
        return;
      }
      setMsg("Randevu oluşturuldu");
      setTimeout(() => {
        resetAll();
        go("/(hasta)/randevularim");
      }, 800);
    } catch {
      setHata("Sunucuya bağlanılamadı");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (msg) {
    return (
      <Screen style={styles.centerPad}>
        <Text style={styles.successTitle}>Tamam</Text>
        <Text style={styles.successText}>{msg}</Text>
      </Screen>
    );
  }

  return (
    <Screen bleed style={{ paddingBottom: 0 }}>
      <View style={{ paddingTop: insets.top }}>
        <PageHero
          title="Randevu al"
          subtitle={
            step === 1
              ? "Bölüm seçin"
              : step === 2
                ? "Doktor ve saat seçin"
                : "Onaylayın"
          }
        />
      </View>
      <View style={styles.content}>
      <StepDots step={step} />
      <ErrorText>{hata}</ErrorText>

      {step > 1 ? (
        <View style={styles.summary}>
          {selectedDep ? (
            <Text style={styles.summaryLine}>Departman: {selectedDep.ad}</Text>
          ) : null}
          {selectedDoktor && step > 2 ? (
            <Text style={styles.summaryLine}>
              Doktor: {doktorAdi(selectedDoktor)}
            </Text>
          ) : null}
        </View>
      ) : null}

      {step === 1 ? (
        <SectionList
          sections={departmanSections}
          keyExtractor={(d) => String(d.id)}
          keyboardShouldPersistTaps="handled"
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={
            <EmptyState
              tone="neutral"
              icon={Hospital}
              title={
                poliklinikAra.trim()
                  ? "Aramanızla eşleşen poliklinik yok"
                  : "Departman bulunamadı"
              }
            />
          }
          ListHeaderComponent={
            <View style={styles.searchWrap}>
              <Text style={styles.hint}>Polikliniği seçin</Text>
              <View style={styles.searchField}>
                <Search size={18} color={colors.muted} strokeWidth={2} />
                <TextInput
                  style={styles.search}
                  value={poliklinikAra}
                  onChangeText={setPoliklinikAra}
                  placeholder="Poliklinik ara (ör. Kardiyoloji)"
                  placeholderTextColor={colors.muted}
                  autoCorrect={false}
                  clearButtonMode="while-editing"
                />
              </View>
            </View>
          }
          renderSectionHeader={({ section }) => (
            <SectionHeader title={section.title} icon={section.icon} />
          )}
          renderItem={({ item }) => (
            <SelectRow
              title={item.ad}
              icon={departmanIcon(item.ad)}
              selected={depId === item.id}
              onPress={() => setDepId(item.id)}
            />
          )}
          contentContainerStyle={styles.listPad}
        />
      ) : null}

      {step === 2 ? (
        <SectionList
          sections={[{ key: "dok", title: "Doktorlar", icon: Stethoscope, data: filteredDoktorlar }]}
          keyExtractor={(d) => String(d.id)}
          ListEmptyComponent={
            <EmptyState
              tone="neutral"
              icon={Stethoscope}
              title="Bu departmanda uygun doktor yok"
            />
          }
          ListHeaderComponent={<Text style={styles.hint}>Doktoru seçin</Text>}
          renderSectionHeader={({ section }) => (
            <SectionHeader title={section.title} icon={section.icon} />
          )}
          renderItem={({ item }) => (
            <SelectRow
              title={doktorAdi(item)}
              subtitle={item.uzmanlik_alani}
              selected={doktorId === item.id}
              onPress={() => setDoktorId(item.id)}
            />
          )}
          contentContainerStyle={styles.listPad}
        />
      ) : null}

      {step === 3 ? (
        slotsLoading ? (
          <View style={styles.centerPad}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : (
          <FlatList
            data={slots.slice(0, 16)}
            keyExtractor={(s) => s}
            numColumns={3}
            columnWrapperStyle={styles.slotRow}
            ListEmptyComponent={
              <EmptyState tone="neutral" icon={Activity} title="Yarın için müsait saat yok" />
            }
            ListHeaderComponent={
              <Text style={styles.hint}>Yarın — {tomorrowYmd()}</Text>
            }
            renderItem={({ item }) => {
              const selected = slot === item;
              return (
                <Pressable
                  onPress={() => setSlot(item)}
                  style={[styles.slot, selected && styles.slotSelected]}
                >
                  <Text
                    style={[styles.slotText, selected && styles.slotTextOn]}
                  >
                    {formatSlot(item)}
                  </Text>
                </Pressable>
              );
            }}
            contentContainerStyle={styles.listPad}
          />
        )
      ) : null}

      <View style={styles.footer}>
        {step > 1 ? (
          <Pressable
            style={styles.backBtn}
            onPress={() => {
              setHata(null);
              if (step === 2) {
                setDoktorId(null);
                setSlot(null);
                setStep(1);
              } else {
                setSlot(null);
                setStep(2);
              }
            }}
          >
            <Text style={styles.backText}>Geri</Text>
          </Pressable>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        {step < 3 ? (
          <PrimaryButton
            label="İleri"
            style={{ flex: 2 }}
            disabled={step === 1 ? !depId : !doktorId}
            onPress={() => {
              setHata(null);
              if (step === 1 && depId) {
                setDoktorId(null);
                setSlot(null);
                setStep(2);
              } else if (step === 2 && doktorId) {
                setSlot(null);
                setStep(3);
              }
            }}
          />
        ) : (
          <PrimaryButton
            label={submitting ? "Kaydediliyor…" : "Randevuyu onayla"}
            style={{ flex: 2 }}
            disabled={!slot || submitting}
            onPress={() => void olustur()}
          />
        )}
      </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: spacing.lg },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
  },
  centerPad: { flex: 1, justifyContent: "center", alignItems: "center" },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
  },
  dotActive: { backgroundColor: palette.navy900 },
  dotLabel: {
    marginLeft: spacing.xs + 2,
    color: palette.navy800,
    fontWeight: "700",
    fontSize: 13,
  },
  summary: {
    marginBottom: spacing.xs,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryLine: { ...typography.bodySm },
  hint: {
    ...typography.bodySm,
    marginBottom: spacing.sm + 2,
  },
  searchWrap: { marginBottom: spacing.xs },
  searchField: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: palette.line,
    borderRadius: radius.md + 2,
    backgroundColor: palette.white,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm + 2,
    ...shadows.cardSoft,
  },
  search: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    color: colors.text,
    fontSize: 15,
  },
  listPad: { paddingBottom: 100 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.md + 2,
    marginBottom: spacing.sm,
  },
  rowSelected: {
    borderColor: palette.navy900,
    borderWidth: 2,
    backgroundColor: palette.bosphorus50,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: palette.bosphorus50,
    alignItems: "center",
    justifyContent: "center",
  },
  rowIconSelected: { backgroundColor: palette.navy900 },
  rowTitle: { fontWeight: "600", color: colors.text, fontSize: 15 },
  rowTitleSelected: { color: palette.navy900 },
  rowSub: { color: colors.muted, fontSize: 12 },
  rowSubSelected: { color: palette.navy800 },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: palette.navy900,
    alignItems: "center",
    justifyContent: "center",
  },
  checkPlaceholder: { width: 22, height: 22 },
  slotRow: { gap: 8, marginBottom: 8 },
  slot: {
    flex: 1,
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  slotSelected: {
    borderColor: palette.navy900,
    backgroundColor: palette.bosphorus50,
  },
  slotText: { fontWeight: "600", color: colors.text },
  slotTextOn: { color: palette.navy900 },
  footer: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  backBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: colors.surface,
  },
  backText: { color: colors.text, fontWeight: "600" },
  successTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.success,
    marginBottom: 8,
  },
  successText: { color: colors.muted },
});
