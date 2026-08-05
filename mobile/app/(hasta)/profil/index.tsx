import { useCallback, useMemo, useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TextInput,
  Switch,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import {
  AlertTriangle,
  Bell,
  HeartPulse,
  IdCard,
  Lock,
  MessageSquare,
  Phone,
  Shield,
  UserRound,
} from "lucide-react-native";
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
  getAppLockEnabled,
  setAppLockEnabled,
} from "@/shared/security/app-lock";
import {
  Badge,
  Card,
  Chip,
  ErrorText,
  Loading,
  MenuRow,
  PrimaryButton,
  Screen,
  SectionHeader,
  colors,
  palette,
  radius,
  spacing,
  typography,
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
  const insets = useSafeAreaInsets();
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
  const [appLock, setAppLock] = useState(false);

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
      setAppLock(await getAppLockEnabled());
      const { syncPushRegistration } = await import("@/shared/push");
      void syncPushRegistration();
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
      const { lastKnownPushToken, unregisterPushTokenWithBackend } =
        await import("@/shared/push");
      await unregisterPushTokenWithBackend(lastKnownPushToken());
      await logoutApi();
      goReplace("/(auth)/giris");
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading) return <Loading />;

  const initials = me
    ? `${me.ad?.[0] ?? ""}${me.soyad?.[0] ?? ""}`.toLocaleUpperCase("tr-TR")
    : "?";

  return (
    <Screen bleed>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => void refresh()} />
        }
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View style={[styles.hero, { paddingTop: insets.top + spacing.lg }]}>
          <View style={styles.heroOrbLg} />
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.heroName}>
            {me ? `${me.ad} ${me.soyad}` : "Profil"}
          </Text>
          {me?.email ? <Text style={styles.heroMeta}>{me.email}</Text> : null}
          <Badge
            kind={me?.kvkk_onaylandi_mi ? "success" : "warning"}
            label={me?.kvkk_onaylandi_mi ? "KVKK onaylı" : "KVKK bekliyor"}
          />
        </View>

        <View style={styles.body}>
        <ErrorText>{hata}</ErrorText>
        {ok ? <Text style={styles.ok}>{ok}</Text> : null}

        <SectionHeader title="Kimlik" icon={IdCard} />
        <Card style={styles.tcCard}>
          <View style={styles.tcRow}>
            <Shield size={20} color={palette.navy800} strokeWidth={2} />
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Text style={typography.label}>TC Kimlik No</Text>
              <Text style={typography.dataMd}>{hasta?.tc_kimlik_no ?? "—"}</Text>
              <Text style={styles.hint}>TC değiştirilemez</Text>
            </View>
          </View>
        </Card>

        <SectionHeader title="Sağlık bilgileri" icon={HeartPulse} />
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
              <Chip
                key={c}
                label={c}
                selected={cinsiyet === c}
                onPress={() => setCinsiyet(c)}
              />
            ))}
          </View>

          <Text style={styles.label}>Kan grubu</Text>
          <View style={styles.chips}>
            {KAN_GRUPLARI.map((k) => (
              <Chip
                key={k}
                label={k}
                selected={kanGrubu === k}
                onPress={() => setKanGrubu(k)}
              />
            ))}
          </View>

          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Boy (cm)</Text>
              <TextInput
                style={[styles.input, typography.dataMd]}
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
                style={[styles.input, typography.dataMd]}
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
              <Text style={typography.dataMd}>{bmi}</Text>
            </>
          ) : null}
        </Card>

        <SectionHeader title="İletişim" icon={Phone} />
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

        <SectionHeader title="Alerjiler" icon={AlertTriangle} />
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
            <SectionHeader title="Yatış özeti" icon={UserRound} />
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

        <SectionHeader title="Güvenlik" icon={Lock} />
        <Card>
          <View style={styles.switchRow}>
            <Text style={styles.value}>Biyometrik uygulama kilidi</Text>
            <Switch
              value={appLock}
              onValueChange={(v) => {
                void setAppLockEnabled(v).then(() => setAppLock(v));
              }}
            />
          </View>
          <Text style={styles.hint}>
            Açıkken uygulama her açılışta ve arka plandan dönüşte doğrulama ister.
          </Text>
        </Card>

        <SectionHeader title="Bildirimler" icon={Bell} />
        <Card>
          <Text style={styles.meta}>
            Tahlil sonucu hazır olduğunda push bildirimi (Faz 1) ve SMS (Faz C)
            gönderilebilir. Push için cihaz izinlerini onaylayın.
          </Text>
        </Card>

        <SectionHeader title="İşlemler" icon={MessageSquare} />
        <MenuRow
          title="Şikayet / öneri gönder"
          icon={MessageSquare}
          onPress={() => go("/(hasta)/sikayet")}
        />

        <Pressable
          style={styles.logoutBtn}
          disabled={loggingOut}
          onPress={() => void onLogout()}
        >
          <Text style={styles.logoutText}>
            {loggingOut ? "Çıkış yapılıyor…" : "Çıkış yap"}
          </Text>
        </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: palette.navy900,
    paddingHorizontal: spacing.lg + 4,
    paddingBottom: spacing.xl,
    overflow: "hidden",
    gap: spacing.sm,
  },
  heroOrbLg: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: palette.white, fontSize: 22, fontWeight: "800" },
  heroName: { color: palette.white, fontSize: 20, fontWeight: "800" },
  heroMeta: { color: "rgba(255,255,255,0.7)", fontSize: 13 },
  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  tcCard: { paddingVertical: spacing.md },
  tcRow: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  label: { ...typography.label, marginTop: spacing.sm },
  value: { ...typography.body },
  hint: { ...typography.bodySm, fontSize: 11, marginTop: 2 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  meta: { ...typography.bodySm },
  ok: { color: palette.green700, marginBottom: spacing.sm, fontWeight: "600" },
  input: {
    borderWidth: 1.5,
    borderColor: palette.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 15,
    color: colors.text,
    backgroundColor: palette.sand100,
    marginTop: spacing.xs,
  },
  inputMulti: { minHeight: 72 },
  row2: { flexDirection: "row", gap: spacing.sm + 2 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs + 2 },
  logoutBtn: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.md + 2,
    backgroundColor: palette.poppy100,
    alignItems: "center",
  },
  logoutText: { color: palette.poppy600, fontWeight: "700", fontSize: 14 },
});
