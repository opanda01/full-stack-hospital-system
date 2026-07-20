import { useState } from "react";
import { Text, TextInput, Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { login } from "@/shared/api";
import { useAuthStore } from "@/shared/auth";

export function GirisYapForm() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("hasta@hastane.example.com");
  const [sifre, setSifre] = useState("Test1234!");
  const [hata, setHata] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setHata(null);
    setLoading(true);
    try {
      const data = await login(email.trim(), sifre);
      if (data.rol !== "HASTA") {
        setHata("Mobil uygulama yalnızca hasta girişi içindir");
        return;
      }
      setAuth(data.access_token, data.rol);
      router.replace("/(hasta)/randevularim");
    } catch {
      setHata("E-posta veya şifre hatalı");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.form}>
      <TextInput
        style={styles.input}
        placeholder="E-posta"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Şifre"
        secureTextEntry
        value={sifre}
        onChangeText={setSifre}
      />
      {hata ? <Text style={styles.error}>{hata}</Text> : null}
      <Pressable style={styles.button} onPress={onSubmit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "…" : "Giriş Yap"}</Text>
      </Pressable>
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
});
