import { ScrollView, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { KayitOlForm } from "@/features/kayit-ol";

export default function KayitScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Hasta Kayıt (OTP)</Text>
      <Text style={styles.subtitle}>
        Telefon doğrulaması ile hesap oluşturun. Şifre gerekmez.
      </Text>
      <KayitOlForm />
      <Pressable onPress={() => router.replace("/(auth)/giris")}>
        <Text style={styles.link}>Girişe dön</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 12,
    backgroundColor: "#f8fafc",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#0c4a6e",
    alignSelf: "stretch",
    maxWidth: 360,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    alignSelf: "stretch",
    maxWidth: 360,
    marginBottom: 4,
  },
  link: { color: "#0369a1", textAlign: "center", marginTop: 8 },
});
