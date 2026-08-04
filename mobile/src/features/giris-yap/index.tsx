import { useEffect, useState } from "react";
import { Text, TextInput, Pressable, StyleSheet, View } from "react-native";
import Constants from "expo-constants";
import { getApiUrl, otpDogrula, otpGonder } from "@/shared/api";
import { gecerliTcKimlikNo, TC_GECERSIZ_MESAJ } from "@/shared/lib/tcKimlik";
import { useAuthStore } from "@/shared/auth";
import { goReplace } from "@/shared/nav";

type Step = "bilgi" | "otp";

function metroGosterim(): string | null {
  const uri =
    Constants.expoConfig?.hostUri ??
    (Constants as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig
      ?.debuggerHost;
  const fallbackPort =
    (
      Constants.expoConfig?.extra as { metroPort?: number } | undefined
    )?.metroPort ?? 8081;
  if (!uri) return null;
  return uri.includes(":") ? uri : `${uri}:${fallbackPort}`;
}

export function GirisYapForm() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const [step, setStep] = useState<Step>("bilgi");
  const [telefon, setTelefon] = useState("05551234567");
  const [tc, setTc] = useState("10000000006");
  const [kod, setKod] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [backendDurum, setBackendDurum] = useState<
    "bekliyor" | "tamam" | "hata"
  >("bekliyor");

  useEffect(() => {
    if (!__DEV__) return;
    let iptal = false;
    const api = getApiUrl();
    fetch(`${api}/health`)
      .then((r) => {
        if (!iptal) setBackendDurum(r.ok ? "tamam" : "hata");
      })
      .catch(() => {
        if (!iptal) setBackendDurum("hata");
      });
    return () => {
      iptal = true;
    };
  }, []);

  const gonder = async () => {
    setHata(null);
    if (!telefon.trim() || !gecerliTcKimlikNo(tc)) {
      setHata(
        tc.trim() && !gecerliTcKimlikNo(tc)
          ? TC_GECERSIZ_MESAJ
          : "Telefon ve TC zorunludur",
      );
      return;
    }
    setLoading(true);
    try {
      const sonuc = await otpGonder({
        telefon: telefon.trim(),
        tc_kimlik_no: tc.trim(),
        amac: "GIRIS",
      });
      if (sonuc.gelistirme_kodu) {
        setKod(sonuc.gelistirme_kodu);
      }
      setStep("otp");
    } catch (e) {
      setHata(e instanceof Error ? e.message : "OTP gönderilemedi");
    } finally {
      setLoading(false);
    }
  };

  const dogrula = async () => {
    setHata(null);
    setLoading(true);
    try {
      const data = await otpDogrula({
        telefon: telefon.trim(),
        tc_kimlik_no: tc.trim(),
        kod: kod.trim(),
        amac: "GIRIS",
      });
      if (data.oturum_tipi !== "hasta" && data.rol !== "HASTA") {
        setHata("Mobil uygulama yalnızca hasta oturumu içindir");
        return;
      }
      await setAuth(
        data.access_token,
        data.refresh_token,
        data.rol ?? "HASTA",
      );
      goReplace("/(hasta)/ozet");
    } catch (e) {
      setHata(e instanceof Error ? e.message : "Doğrulama başarısız");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.form}>
      {__DEV__ ? (
        <View style={styles.devBox}>
          <Text style={styles.devApi} numberOfLines={2}>
            Metro (uygulama kodu): {metroGosterim() ?? "—"}
          </Text>
          <Text style={styles.devApi} numberOfLines={3}>
            API (Metro proxy): {getApiUrl()}
            {backendDurum === "tamam"
              ? " ✓"
              : backendDurum === "hata"
                ? " — ulaşılamıyor (Metro’yu yeniden başlatın, Docker ayakta mı?)"
                : " …"}
          </Text>
        </View>
      ) : null}
      {step === "bilgi" ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Telefon"
            keyboardType="phone-pad"
            value={telefon}
            onChangeText={setTelefon}
          />
          <TextInput
            style={styles.input}
            placeholder="TC Kimlik No"
            keyboardType="number-pad"
            maxLength={11}
            value={tc}
            onChangeText={setTc}
          />
          {hata ? <Text style={styles.error}>{hata}</Text> : null}
          <Pressable style={styles.button} onPress={gonder} disabled={loading}>
            <Text style={styles.buttonText}>
              {loading ? "…" : "Doğrulama kodu gönder"}
            </Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.hint}>
            {telefon} numarasına gönderilen 6 haneli kodu girin.
            {kod
              ? `\n(Dev: kod otomatik dolduruldu)`
              : "\n(Dev: SMS konsol/stub çıktısına bakın)"}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="OTP kodu"
            keyboardType="number-pad"
            maxLength={6}
            value={kod}
            onChangeText={setKod}
          />
          {hata ? <Text style={styles.error}>{hata}</Text> : null}
          <Pressable style={styles.button} onPress={dogrula} disabled={loading}>
            <Text style={styles.buttonText}>
              {loading ? "…" : "Giriş yap"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setStep("bilgi");
              setKod("");
              setHata(null);
            }}
          >
            <Text style={styles.link}>Bilgileri değiştir</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  form: { width: "100%", maxWidth: 320, gap: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#0c4a6e",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  error: { color: "#dc2626", fontSize: 12 },
  hint: { color: "#64748b", fontSize: 13, marginBottom: 4 },
  devBox: { marginBottom: 8, gap: 4 },
  devApi: { color: "#94a3b8", fontSize: 11 },
  link: { color: "#0369a1", textAlign: "center", marginTop: 4 },
});
