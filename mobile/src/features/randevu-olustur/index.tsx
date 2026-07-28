import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { apiFetch } from "@/shared/api";
import { go } from "@/shared/nav";
import {
  Card,
  EmptyText,
  ErrorText,
  PrimaryButton,
  Screen,
  colors,
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
}: {
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, selected && styles.rowSelected]}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.rowTitle, selected && styles.rowTitleSelected]}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
      </View>
      <View style={[styles.radio, selected && styles.radioOn]} />
    </Pressable>
  );
}

export function RandevuOlusturForm() {
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
    <Screen style={{ paddingTop: 12 }}>
      <StepDots step={step} />
      <ErrorText>{hata}</ErrorText>

      {step > 1 ? (
        <Card style={styles.summary}>
          {selectedDep ? (
            <Text style={styles.summaryLine}>Departman: {selectedDep.ad}</Text>
          ) : null}
          {selectedDoktor && step > 2 ? (
            <Text style={styles.summaryLine}>
              Doktor: {doktorAdi(selectedDoktor)}
            </Text>
          ) : null}
        </Card>
      ) : null}

      {step === 1 ? (
        <FlatList
          data={filteredDepartmanlar}
          keyExtractor={(d) => String(d.id)}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <EmptyText>
              {poliklinikAra.trim()
                ? "Aramanızla eşleşen poliklinik yok"
                : "Departman bulunamadı"}
            </EmptyText>
          }
          ListHeaderComponent={
            <View style={styles.searchWrap}>
              <Text style={styles.hint}>Polikliniği seçin</Text>
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
          }
          renderItem={({ item }) => (
            <SelectRow
              title={item.ad}
              selected={depId === item.id}
              onPress={() => setDepId(item.id)}
            />
          )}
          contentContainerStyle={styles.listPad}
        />
      ) : null}

      {step === 2 ? (
        <FlatList
          data={filteredDoktorlar}
          keyExtractor={(d) => String(d.id)}
          ListEmptyComponent={
            <EmptyText>Bu departmanda uygun doktor yok</EmptyText>
          }
          ListHeaderComponent={<Text style={styles.hint}>Doktoru seçin</Text>}
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
            ListEmptyComponent={<EmptyText>Yarın için müsait saat yok</EmptyText>}
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
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  dotActive: { backgroundColor: colors.primary },
  dotLabel: {
    marginLeft: 6,
    color: colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  summary: { marginBottom: 4, paddingVertical: 10 },
  summaryLine: { color: colors.muted, fontSize: 13 },
  hint: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 10,
  },
  searchWrap: { marginBottom: 4 },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    marginBottom: 10,
    fontSize: 15,
  },
  listPad: { paddingBottom: 100 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  rowSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.primarySoft,
  },
  rowTitle: { fontWeight: "600", color: colors.text, fontSize: 15 },
  rowTitleSelected: { color: colors.primary },
  rowSub: { color: colors.muted, fontSize: 12 },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.border,
  },
  radioOn: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
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
    borderColor: colors.accent,
    backgroundColor: colors.primarySoft,
  },
  slotText: { fontWeight: "600", color: colors.text },
  slotTextOn: { color: colors.primary },
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
