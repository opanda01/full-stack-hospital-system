import { useCallback, useState } from "react";
import { FlatList, Text, View, StyleSheet } from "react-native";
import { useFocusEffect } from "expo-router";
import { apiFetch } from "@/shared/api";

type Tetkik = {
  id: number;
  tetkik_turu: string;
  durum: string;
  sonuc_dosyasi: string | null;
};

export default function TetkikSonuclarimScreen() {
  const [items, setItems] = useState<Tetkik[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const res = await apiFetch("/tetkikler/");
        if (res.ok) setItems(await res.json());
      })();
    }, []),
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        ListEmptyComponent={<Text>Tetkik sonucu yok</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text>
              {item.tetkik_turu} — {item.durum}
            </Text>
            <Text>{item.sonuc_dosyasi ?? "Sonuç bekleniyor"}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f8fafc" },
  card: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
});
