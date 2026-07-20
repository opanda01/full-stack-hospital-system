import { useCallback, useState } from "react";
import { Pressable, Text, View, StyleSheet, FlatList } from "react-native";
import { useFocusEffect } from "expo-router";
import { apiFetch } from "@/shared/api";

type Randevu = {
  id: number;
  tarih_saat: string;
  durum: string;
  doktor_id: number;
};

export default function RandevularimScreen() {
  const [items, setItems] = useState<Randevu[]>([]);

  const load = useCallback(async () => {
    const res = await apiFetch("/randevular/");
    if (res.ok) setItems(await res.json());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const iptal = async (id: number) => {
    await apiFetch(`/randevular/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        ListEmptyComponent={<Text>Randevu yok</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text>
              #{item.id} — {new Date(item.tarih_saat).toLocaleString("tr-TR")}
            </Text>
            <Text>{item.durum}</Text>
            {item.durum !== "IPTAL" && (
              <Pressable onPress={() => iptal(item.id)}>
                <Text style={styles.link}>İptal et</Text>
              </Pressable>
            )}
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
    gap: 4,
  },
  link: { color: "#b91c1c", marginTop: 4 },
});
