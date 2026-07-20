import { useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { apiFetch } from "@/shared/api";

export default function KayitScreen() {
  const [tc, setTc] = useState("");
  const [ad, setAd] = useState("");
  const [soyad, setSoyad] = useState("");
  const [email, setEmail] = useState("");
  const [sifre, setSifre] = useState("");
  const [loading, setLoading] = useState(false);

  const kaydet = async () => {
    if (!tc || !ad || !soyad || !email || !sifre) {
      Alert.alert("Eksik bilgi", "Tüm alanları doldurun.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          tc_kimlik_no: tc,
          ad,
          soyad,
          email,
          sifre,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        Alert.alert("Kayıt başarısız", body.detail ?? "Tekrar deneyin");
        return;
      }
      Alert.alert("Başarılı", "Hesabınız oluşturuldu. Giriş yapabilirsiniz.", [
        { text: "Giriş", onPress: () => router.replace("/(auth)/giris") },
      ]);
    } catch {
      Alert.alert("Hata", "Sunucuya bağlanılamadı");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Hasta Kayıt</Text>
      <TextInput
        style={styles.input}
        placeholder="TC Kimlik No"
        value={tc}
        onChangeText={setTc}
        keyboardType="number-pad"
      />
      <TextInput style={styles.input} placeholder="Ad" value={ad} onChangeText={setAd} />
      <TextInput
        style={styles.input}
        placeholder="Soyad"
        value={soyad}
        onChangeText={setSoyad}
      />
      <TextInput
        style={styles.input}
        placeholder="E-posta"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Şifre"
        value={sifre}
        onChangeText={setSifre}
        secureTextEntry
      />
      <Pressable style={styles.button} onPress={kaydet} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "Kaydediliyor…" : "Kayıt ol"}</Text>
      </Pressable>
      <Pressable onPress={() => router.replace("/(auth)/giris")}>
        <Text style={styles.link}>Girişe dön</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, gap: 12, backgroundColor: "#f8fafc" },
  title: { fontSize: 20, fontWeight: "600", marginBottom: 8, color: "#0c4a6e" },
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
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  link: { color: "#0369a1", textAlign: "center", marginTop: 8 },
});
