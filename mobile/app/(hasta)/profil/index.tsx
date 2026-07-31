import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TextInput,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { fetchMe, logoutApi, type MeResponse } from "@/shared/api";
import {
  fetchAlerjilerim,
  fetchHastaBen,
  updateHastaProfil,
  fetchHastaOzet,
} from "@/shared/api/hastaApi";
import type { AlerjiDto, HastaDto, HastaYatisOzetDto } from "@/shared/api/types";
import { go, goReplace } from "@/shared/nav";
import {
  Card,
  ErrorText,
  Loading,
  MenuRow,
  PrimaryButton,
  Screen,
  SectionTitle,
  colors,
} from "@/shared/ui";

const CINSIYETLER = ["Erkek", "Kadın", "Belirtilmedi"] as const;
const KAN_GRUPLARI = ["A+", "A-", "B+", "B-", "AB+", "AB-", "0+", "0-"] as const;

function parseNum(raw: string): number | null {
  const t = raw.trim().replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}

function bmiLabel(boyCm: number | null, kiloKg: number | null): string | null {
  if (boyCm == null || kiloKg == null || boyCm <= 0) return null;
  const m = boyCm / 100;
  const bmi = kiloKg / (m * m);
  if (!Number.isFinite(bmi)) return null;
  let kategori = "Normal";
  if (bmi < 18.5) kategori = "Zayıf";
  else if (bmi < 25) kategori = "Normal";
  else if (bmi < 30) kategori = "Fazla kilolu";
  else kategori = "Obez";
  return `${bmi.toFixed(1)} · ${kategori}`;
}

export default function ProfilScreen() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [hasta, setHasta] = useState<HastaDto | null>(null);
  const [alerjiler, setAlerjiler] = useState<AlerjiDto[]>([]);
  const [hata, setHata] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [dogumTarihi, setDogumTarihi] = useState("");
  const [cinsiyet, setCinsiyet] = useState<string | null>(null);
  const [kanGrubu, setKanGrubu] = useState<string | null>(null);
  const [boy, setBoy] = useState("");
  const [kilo, setKilo] = useState("");
  const [telefon, setTelefon] = useState("");
  const [adres, setAdres] = useState("");
  const [yatis, setYatis] = useState<HastaYatisOzetDto | null>(null);

  const applyHasta = useCallback((h: HastaDto | null) => {
    setHasta(h);
    setDogumTarihi(h?.dogum_tarihi ?? "");
    setCinsiyet(h?.cinsiyet ?? null);
    setKanGrubu(h?.kan_grubu ?? null);
    setBoy(h?.boy_cm != null ? String(h.boy_cm) : "");
    setKilo(h?.kilo_kg != null ? String(h.kilo_kg) : "");
    setTelefon(h?.telefon ?? "");
    setAdres(h?.adres ?? "");
  }, []);

  const refresh = useCallback(async () => {
    setHata(null);
    try {
      const [m, h, a, oz] = await Promise.all([
        fetchMe(),
        fetchHastaBen().catch(() => null),
        fetchAlerjilerim().catch(() => [] as AlerjiDto[]),
        fetchHastaOzet().catch(() => null),
      ]);
      setMe(m);
      applyHasta(h);
      setAlerjiler(a);
      setYatis(oz?.yatis ?? null);
    } catch (e) {
      setHata(e instanceof Error ? e.message : "Profil yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [applyHasta]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void refresh();
    }, [refresh]),
  );

  const bmi = useMemo(() => {
    const b = parseNum(boy);
    const k = parseNum(kilo);
    if (b == null || k == null || Number.isNaN(b) || Number.isNaN(k)) return null;
    return bmiLabel(b, k);
  }, [boy, kilo]);

  const onSave = async () => {
    setHata(null);
    setOk(null);
    const boyN = parseNum(boy);
    const kiloN = parseNum(kilo);
    if (boy.trim() && (boyN == null || Number.isNaN(boyN))) {
      setHata("Boy sayısal olmalı (cm)");
      return;
    }
    if (kilo.trim() && (kiloN == null || Number.isNaN(kiloN))) {
      setHata("Kilo sayısal olmalı (kg)");
      return;
    }
    if (boyN != null && (boyN < 50 || boyN > 250)) {
      setHata("Boy 50–250 cm aralığında olmalı");
      return;
    }
    if (kiloN != null && (kiloN < 2 || kiloN > 500)) {
      setHata("Kilo 2–500 kg aralığında olmalı");
      return;
    }
    const tel = telefon.trim();
    if (tel && tel.length < 10) {
      setHata("Telefon en az 10 karakter olmalı");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateHastaProfil({
        dogum_tarihi: dogumTarihi.trim() || null,
        cinsiyet: cinsiyet,
        kan_grubu: kanGrubu,
        adres: adres.trim() || null,
        boy_cm: boy.trim() ? boyN : null,
        kilo_kg: kilo.trim() ? kiloN : null,
        ...(tel ? { telefon: tel } : {}),
      });
      applyHasta(updated);
      setOk("Bilgileriniz kaydedildi");
    } catch (e) {
      setHata(e instanceof Error ? e.message : "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const onLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutApi();
      goReplace("/(auth)/giris");
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <Screen>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => void refresh()} />
        }
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <ErrorText>{hata}</ErrorText>
        {ok ? <Text style={styles.ok}>{ok}</Text> : null}

        <View style={styles.hero}>
          <Text style={styles.heroName}>
            {me ? `${me.ad} ${me.soyad}` : "Profil"}
          </Text>
          {me?.email ? <Text style={styles.heroMeta}>{me.email}</Text> : null}
          <Text style={styles.heroMeta}>
            KVKK: {me?.kvkk_onaylandi_mi ? "Onaylandı" : "Bekliyor"}
          </Text>
        </View>

        <SectionTitle>Kimlik</SectionTitle>
        <Card>
          <Text style={styles.label}>TC Kimlik No</Text>
          <Text style={styles.value}>{hasta?.tc_kimlik_no ?? "—"}</Text>
          <Text style={styles.hint}>TC değiştirilemez</Text>
        </Card>

        <SectionTitle>Sağlık bilgileri</SectionTitle>
        <Card>
          <Text style={styles.label}>Doğum tarihi (YYYY-AA-GG)</Text>
          <TextInput
            style={styles.input}
            value={dogumTarihi}
            onChangeText={setDogumTarihi}
            placeholder="1990-05-12"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Cinsiyet</Text>
          <View style={styles.chips}>
            {CINSIYETLER.map((c) => (
              <Pressable
                key={c}
                style={[styles.chip, cinsiyet === c && styles.chipOn]}
                onPress={() => setCinsiyet(c)}
              >
                <Text style={[styles.chipText, cinsiyet === c && styles.chipTextOn]}>
                  {c}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Kan grubu</Text>
          <View style={styles.chips}>
            {KAN_GRUPLARI.map((k) => (
              <Pressable
                key={k}
                style={[styles.chip, kanGrubu === k && styles.chipOn]}
                onPress={() => setKanGrubu(k)}
              >
                <Text style={[styles.chipText, kanGrubu === k && styles.chipTextOn]}>
                  {k}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Boy (cm)</Text>
              <TextInput
                style={styles.input}
                value={boy}
                onChangeText={setBoy}
                keyboardType="decimal-pad"
                placeholder="170"
                placeholderTextColor={colors.muted}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Kilo (kg)</Text>
              <TextInput
                style={styles.input}
                value={kilo}
                onChangeText={setKilo}
                keyboardType="decimal-pad"
                placeholder="70"
                placeholderTextColor={colors.muted}
              />
            </View>
          </View>
          {bmi ? (
            <>
              <Text style={styles.label}>VKİ (BMI)</Text>
              <Text style={styles.value}>{bmi}</Text>
            </>
          ) : null}
        </Card>

        <SectionTitle>İletişim</SectionTitle>
        <Card>
          <Text style={styles.label}>Telefon</Text>
          <TextInput
            style={styles.input}
            value={telefon}
            onChangeText={setTelefon}
            keyboardType="phone-pad"
            placeholder="05xxxxxxxxx"
            placeholderTextColor={colors.muted}
          />
          <Text style={styles.label}>Adres</Text>
          <TextInput
            style={[styles.input, styles.inputMulti]}
            value={adres}
            onChangeText={setAdres}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholder="İl / ilçe / mahalle…"
            placeholderTextColor={colors.muted}
          />
        </Card>

        <PrimaryButton
          label={saving ? "Kaydediliyor…" : "Bilgileri kaydet"}
          disabled={saving}
          onPress={() => void onSave()}
        />

        <SectionTitle>Alerjiler</SectionTitle>
        {alerjiler.length ? (
          alerjiler.map((a) => (
            <Card key={a.id}>
              <Text style={styles.value}>{a.allerjen_adi}</Text>
              <Text style={styles.meta}>
                {a.allerjen_tipi} · {a.siddet}
              </Text>
              {a.notlar ? <Text style={styles.meta}>{a.notlar}</Text> : null}
            </Card>
          ))
        ) : (
          <Card>
            <Text style={styles.meta}>
              Kayıtlı alerji yok (personel ekleyebilir).
            </Text>
          </Card>
        )}

        {yatis?.aktif_mi ? (
          <>
            <SectionTitle>Yatış özeti</SectionTitle>
            <Card>
              <Text style={styles.value}>
                {yatis.servis_adi ?? "Servis"} · Protokol {yatis.protokol_no ?? "—"}
              </Text>
              <Text style={styles.meta}>
                {[yatis.oda_no && `Oda ${yatis.oda_no}`, yatis.yatak_no && `Yatak ${yatis.yatak_no}`]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            </Card>
          </>
        ) : null}

        <SectionTitle>Bildirimler</SectionTitle>
        <Card>
          <Text style={styles.meta}>
            Randevu hatırlatma ve tetkik sonucu bildirimleri SMS (Faz C) ile
            gönderilecektir. Sonuç hazır olduğunda kayıtlı telefonunuza mesaj
            gidebilir.
          </Text>
        </Card>

        <SectionTitle>İşlemler</SectionTitle>
        <MenuRow
          title="Şikayet / öneri gönder"
          onPress={() => go("/(hasta)/sikayet")}
        />

        <PrimaryButton
          label={loggingOut ? "Çıkış yapılıyor…" : "Çıkış"}
          disabled={loggingOut}
          onPress={() => void onLogout()}
          style={{ marginTop: 16 }}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    gap: 4,
  },
  heroName: { color: "#fff", fontSize: 20, fontWeight: "700" },
  heroMeta: { color: "#e0f2fe", fontSize: 13 },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginTop: 8 },
  value: { color: colors.text, fontSize: 15 },
  hint: { color: colors.muted, fontSize: 11, marginTop: 2 },
  meta: { color: colors.muted, fontSize: 13 },
  ok: { color: "#15803d", marginBottom: 8, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    backgroundColor: "#fff",
    marginTop: 4,
  },
  inputMulti: { minHeight: 72 },
  row2: { flexDirection: "row", gap: 10 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  chipOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: { color: colors.text, fontSize: 13, fontWeight: "600" },
  chipTextOn: { color: "#fff" },
});
