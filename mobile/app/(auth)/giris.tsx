import { Text, View, StyleSheet } from "react-native";
import { Link } from "expo-router";
import { GirisYapForm } from "@/features/giris-yap";

export default function GirisScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Çanakkale Mehmet Akif Ersoy Devlet Hastanesi</Text>
      <Text style={styles.subtitle}>Hasta Mobil Giriş</Text>
      <GirisYapForm />
      <Link href="/(auth)/kayit" style={styles.link}>
        Hesap oluştur
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 12,
    backgroundColor: "#f8fafc",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    color: "#0c4a6e",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 8,
  },
  link: {
    color: "#0369a1",
    marginTop: 8,
  },
});
