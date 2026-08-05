import { Text, View, StyleSheet } from "react-native";
import { Link } from "expo-router";
import { GirisYapForm } from "@/features/giris-yap";
import { palette, spacing } from "@/shared/ui";

export default function GirisScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <Text style={styles.title}>Devlet Hastanesi</Text>
        <Text style={styles.subtitle}>Hasta mobil giriş (OTP)</Text>
      </View>
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
    padding: spacing.xl,
    gap: spacing.md,
    backgroundColor: palette.sand50,
  },
  brand: { alignItems: "center", gap: spacing.xs, marginBottom: spacing.sm },
  title: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    color: palette.navy900,
  },
  subtitle: {
    fontSize: 14,
    color: palette.slate600,
  },
  link: {
    color: palette.bosphorus500,
    marginTop: spacing.sm,
    fontWeight: "600",
  },
});
