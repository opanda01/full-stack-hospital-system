import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { apiFetch } from "@/shared/api";

type Departman = { id: number; ad: string };
type Doktor = {
  id: number;
  uzmanlik_alani: string;
  personel_id: number;
  ad: string | null;
  soyad: string | null;
  departman_id: number | null;
  online_randevu_acik_mi: boolean;
};
type Hasta = { id: number; kullanici_id: number };

function tomorrowYmd(): string {
  const tarih = new Date();
  tarih.setDate(tarih.getDate() + 1);
  return tarih.toISOString().slice(0, 10);
}

export function RandevuOlusturForm() {
  const [departmanlar, setDepartmanlar] = useState<Departman[]>([]);
  const [doktorlar, setDoktorlar] = useState<Doktor[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [depId, setDepId] = useState<number | null>(null);
  const [doktorId, setDoktorId] = useState<number | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [hastaId, setHastaId] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const filteredDoktorlar = useMemo(
    () =>
      doktorlar.filter(
        (d) =>
          d.departman_id === depId &&
          d.online_randevu_acik_mi !== false,
      ),
    [doktorlar, depId],
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      setHata(null);
      try {
        const [hRes, dRes, dokRes] = await Promise.all([
          apiFetch("/hastalar/ben"),
          apiFetch("/departmanlar/"),
          apiFetch("/doktorlar/"),
        ]);
        if (!hRes.ok) throw new Error("Hasta kaydı alınamadı");
        if (!dRes.ok) throw new Error("Departmanlar yüklenemedi");
        if (!dokRes.ok) throw new Error("Doktorlar yüklenemedi");
        const mine = (await hRes.json()) as Hasta;
        setHastaId(mine.id);
        setDepartmanlar(await dRes.json());
        setDoktorlar(await dokRes.json());
      } catch (e) {
        setHata(e instanceof Error ? e.message : "Veriler yüklenemedi");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    setDoktorId(null);
    setSlot(null);
    setSlots([]);
  }, [depId]);

  useEffect(() => {
    if (!doktorId) {
      setSlots([]);
      setSlot(null);
      return;
    }
    const ymd = tomorrowYmd();
    (async () => {
      setHata(null);
      const res = await apiFetch(
        `/randevular/musait?doktor_id=${doktorId}&tarih=${ymd}`,
      );
      if (!res.ok) {
        setHata("Müsait slotlar alınamadı");
        setSlots([]);
        return;
      }
      setSlots(await res.json());
    })();
  }, [doktorId]);

  const olustur = async () => {
    if (!depId || !doktorId || !slot || !hastaId) {
      setMsg("Eksik seçim veya hasta kaydı yok");
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
      setSlot(null);
      setDoktorId(null);
      setDepId(null);
    } catch {
      setHata("Sunucuya bağlanılamadı");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#0369a1" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {hata ? <Text style={styles.error}>{hata}</Text> : null}
      <Text style={styles.title}>1. Departman</Text>
      {departmanlar.length === 0 ? (
        <Text style={styles.empty}>Departman bulunamadı</Text>
      ) : (
        departmanlar.map((d) => (
          <Pressable
            key={d.id}
            onPress={() => setDepId(d.id)}
            style={[styles.chip, depId === d.id && styles.chipActive]}
          >
            <Text>
              {depId === d.id ? "✓ " : ""}
              {d.ad}
            </Text>
          </Pressable>
        ))
      )}

      <Text style={styles.title}>2. Doktor</Text>
      {!depId ? (
        <Text style={styles.empty}>Önce departman seçin</Text>
      ) : filteredDoktorlar.length === 0 ? (
        <Text style={styles.empty}>Bu departmanda doktor yok</Text>
      ) : (
        filteredDoktorlar.map((d) => {
          const ad = [d.ad, d.soyad].filter(Boolean).join(" ") || `#${d.id}`;
          return (
            <Pressable
              key={d.id}
              onPress={() => setDoktorId(d.id)}
              style={[styles.chip, doktorId === d.id && styles.chipActive]}
            >
              <Text>
                {doktorId === d.id ? "✓ " : ""}
                {ad} — {d.uzmanlik_alani}
              </Text>
            </Pressable>
          );
        })
      )}

      <Text style={styles.title}>3. Saat (yarın — {tomorrowYmd()})</Text>
      {!doktorId ? (
        <Text style={styles.empty}>Önce doktor seçin</Text>
      ) : slots.length === 0 ? (
        <Text style={styles.empty}>Müsait slot yok</Text>
      ) : (
        slots.slice(0, 12).map((s) => (
          <Pressable
            key={s}
            onPress={() => setSlot(s)}
            style={[styles.chip, slot === s && styles.chipActive]}
          >
            <Text>
              {slot === s ? "✓ " : ""}
              {new Date(s).toLocaleTimeString("tr-TR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </Pressable>
        ))
      )}

      <Pressable
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={olustur}
        disabled={submitting}
      >
        <Text style={styles.buttonText}>
          {submitting ? "Kaydediliyor…" : "Randevu Al"}
        </Text>
      </Pressable>
      {msg ? <Text style={styles.msg}>{msg}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  container: { padding: 16, gap: 8, paddingBottom: 40 },
  title: { fontSize: 16, fontWeight: "600", marginTop: 12, color: "#0f172a" },
  chip: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
  },
  chipActive: { borderColor: "#0369a1", backgroundColor: "#e0f2fe" },
  button: {
    marginTop: 16,
    backgroundColor: "#0369a1",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "600" },
  msg: { marginTop: 8, color: "#15803d" },
  error: { color: "#dc2626", marginBottom: 4 },
  empty: { color: "#64748b", fontSize: 13 },
});
