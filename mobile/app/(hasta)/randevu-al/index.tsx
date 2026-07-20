import { useEffect, useState } from "react";
import { Pressable, Text, View, StyleSheet, ScrollView } from "react-native";
import { apiFetch } from "@/shared/api";

type Departman = { id: number; ad: string };
type Doktor = { id: number; uzmanlik_alani: string; personel_id: number };
type Hasta = { id: number; kullanici_id: number };

export default function RandevuAlScreen() {
  const [departmanlar, setDepartmanlar] = useState<Departman[]>([]);
  const [doktorlar, setDoktorlar] = useState<Doktor[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [depId, setDepId] = useState<number | null>(null);
  const [doktorId, setDoktorId] = useState<number | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [hastaId, setHastaId] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const meRes = await apiFetch("/auth/me");
      if (!meRes.ok) return;
      const hRes = await apiFetch("/hastalar/ben");
      if (hRes.ok) {
        const mine = (await hRes.json()) as Hasta;
        setHastaId(mine.id);
      }
      const dRes = await apiFetch("/departmanlar/");
      if (dRes.ok) setDepartmanlar(await dRes.json());
    })();
  }, []);

  useEffect(() => {
    if (!depId) return;
    (async () => {
      const res = await apiFetch("/doktorlar/");
      if (res.ok) {
        const all = (await res.json()) as Doktor[];
        setDoktorlar(all);
      }
    })();
  }, [depId]);

  useEffect(() => {
    if (!doktorId) return;
    const tarih = new Date();
    tarih.setDate(tarih.getDate() + 1);
    const ymd = tarih.toISOString().slice(0, 10);
    (async () => {
      const res = await apiFetch(`/randevular/musait?doktor_id=${doktorId}&tarih=${ymd}`);
      if (res.ok) setSlots(await res.json());
    })();
  }, [doktorId]);

  const olustur = async () => {
    if (!depId || !doktorId || !slot || !hastaId) {
      setMsg("Eksik seçim veya hasta kaydı yok");
      return;
    }
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
    setMsg(res.ok ? "Randevu oluşturuldu" : "Randevu oluşturulamadı");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>1. Departman</Text>
      {departmanlar.map((d) => (
        <Pressable key={d.id} onPress={() => setDepId(d.id)} style={styles.chip}>
          <Text>{depId === d.id ? "✓ " : ""}{d.ad}</Text>
        </Pressable>
      ))}
      <Text style={styles.title}>2. Doktor</Text>
      {doktorlar.map((d) => (
        <Pressable key={d.id} onPress={() => setDoktorId(d.id)} style={styles.chip}>
          <Text>
            {doktorId === d.id ? "✓ " : ""}#{d.id} {d.uzmanlik_alani}
          </Text>
        </Pressable>
      ))}
      <Text style={styles.title}>3. Saat (yarın)</Text>
      {slots.slice(0, 12).map((s) => (
        <Pressable key={s} onPress={() => setSlot(s)} style={styles.chip}>
          <Text>
            {slot === s ? "✓ " : ""}
            {new Date(s).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </Pressable>
      ))}
      <Pressable style={styles.button} onPress={olustur}>
        <Text style={styles.buttonText}>Randevu Al</Text>
      </Pressable>
      {msg ? <Text>{msg}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8, backgroundColor: "#f8fafc" },
  title: { fontWeight: "600", marginTop: 12 },
  chip: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  button: {
    marginTop: 16,
    backgroundColor: "#0c4a6e",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600" },
});
