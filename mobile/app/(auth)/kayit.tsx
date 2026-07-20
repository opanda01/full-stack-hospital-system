import { Text, View, StyleSheet } from "react-native";

export default function KayitScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hasta Kayıt</Text>
      <Text style={styles.muted}>TODO: kayıt formu</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  title: { fontSize: 20, fontWeight: "600" },
  muted: { color: "#64748b", marginTop: 8 },
});
