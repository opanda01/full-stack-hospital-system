import { useState } from "react";
import {
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  View,
  Switch,
} from "react-native";
import { router } from "expo-router";
import { otpDogrula, otpGonder } from "@/shared/api";
import { useAuthStore } from "@/shared/auth";

type Step = "bilgi" | "otp";

export function KayitOlForm() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const [step, setStep] = useState<Step>("bilgi");
  const [telefon, setTelefon] = useState("");
  const [tc, setTc] = useState("");
  const [ad, setAd] = useState("");
  const [soyad, setSoyad] = useState("");
  const [kvkk, setKvkk] = useState(false);
  const [kod, setKod] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const gonder = async () => {
    setHata(null);
    if (!telefon.trim() || tc.trim().length !== 11 || !ad.trim() || !soyad.trim()) {
      setHata("Telefon, TC, ad ve soyad zorunludur");
      return;
    }
    if (!kvkk) {
      setHata("Kayıt için KVKK onayı zorunludur");
      return;
    }
    setLoading(true);
    try {
      await otpGonder({
        telefon: telefon.trim(),
        tc_kimlik_no: tc.trim(),
        amac: "KAYIT",
      });
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
        amac: "KAYIT",
        ad: ad.trim(),
        soyad: soyad.trim(),
        kvkk_onay: true,
      });
      await setAuth(
        data.access_token,
        data.refresh_token,
        data.rol ?? "HASTA",
      );
      router.replace("/(hasta)/randevularim");
    } catch (e) {
      setHata(e instanceof Error ? e.message : "Kayıt doğrulama başarısız");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.form}>
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
          <TextInput
            style={styles.input}
            placeholder="Ad"
            value={ad}
            onChangeText={setAd}
          />
          <TextInput
            style={styles.input}
            placeholder="Soyad"
            value={soyad}
            onChangeText={setSoyad}
          />
          <View style={styles.kvkkRow}>
            <Switch value={kvkk} onValueChange={setKvkk} />
            <Text style={styles.kvkkText}>
              KVKK aydınlatma metnini okudum, kişisel verilerimin işlenmesini
              onaylıyorum.
            </Text>
          </View>
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
              {loading ? "…" : "Kaydı tamamla"}
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
  form: { width: "100%", maxWidth: 360, gap: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#0369a1",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  error: { color: "#dc2626", fontSize: 12 },
  hint: { color: "#64748b", fontSize: 13, marginBottom: 4 },
  link: { color: "#0369a1", textAlign: "center", marginTop: 4 },
  kvkkRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  kvkkText: { flex: 1, color: "#334155", fontSize: 13, lineHeight: 18 },
});
