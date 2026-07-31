import { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  StyleSheet,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { fetchKlinikOnaylar, fetchMuayeneler } from "@/shared/api/hastaApi";
import type { ReceteKalemDto } from "@/shared/api/types";
import { go } from "@/shared/nav";
import { Card, EmptyText, ErrorText, Loading, Screen, colors } from "@/shared/ui";

type ReceteSatir = {
  key: string;
  muayeneId: number | null;
  klinikId: number | null;
  baslik: string;
  tani: string | null;
  kalem: ReceteKalemDto | null;
  receteMetin: string | null;
};

export default function RecetelerimScreen() {
  const [items, setItems] = useState<ReceteSatir[]>([]);
  const [loading, setLoading] = useState(true);
  const [hata, setHata] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setHata(null);
    try {
      const [muayenePage, klinikPage] = await Promise.all([
        fetchMuayeneler(1, 100),
        fetchKlinikOnaylar(1, 50),
      ]);
      const rows: ReceteSatir[] = [];
      for (const k of klinikPage.items.filter((x) => x.tur === "RECETE")) {
        rows.push({
          key: `ko-${k.id}`,
          muayeneId: k.muayene_id,
          klinikId: k.id,
          baslik: "Onaylı reçete",
          tani: null,
          kalem: null,
          receteMetin: k.icerik,
        });
      }
      for (const m of muayenePage.items) {
        if (m.recete_kalemleri?.length) {
          for (const k of m.recete_kalemleri) {
            rows.push({
              key: `k-${k.id}`,
              muayeneId: m.id,
              klinikId: null,
              baslik: k.urun_adi,
              tani: m.tani,
              kalem: k,
              receteMetin: null,
            });
          }
        } else if (m.receteler?.trim()) {
          rows.push({
            key: `m-${m.id}`,
            muayeneId: m.id,
            klinikId: null,
            baslik: "Reçete (muayene)",
            tani: m.tani,
            kalem: null,
            receteMetin: m.receteler,
          });
        }
      }
      setItems(rows);
    } catch {
      setHata("Reçeteler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void refresh();
    }, [refresh]),
  );

  if (loading) return <Loading />;

  return (
    <Screen>
      <ErrorText>{hata}</ErrorText>
      <FlatList
        data={items}
        keyExtractor={(i) => i.key}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => void refresh()} />
        }
        ListEmptyComponent={<EmptyText>Reçete kaydı yok</EmptyText>}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              if (item.klinikId != null) {
                go(
                  `/(hasta)/belgelerim/${item.klinikId}?kaynak=${encodeURIComponent("KLINIK_ONAY")}`,
                );
              } else if (item.muayeneId != null) {
                go(`/(hasta)/muayenelerim/${item.muayeneId}`);
              }
            }}
          >
            <Card>
              <Text style={styles.title}>
                {item.kalem?.urun_adi ?? item.baslik}
              </Text>
              <Text style={styles.meta}>
                Muayene #{item.muayeneId}
                {item.tani ? ` · ${item.tani}` : ""}
              </Text>
              {item.kalem ? (
                <Text style={styles.meta}>
                  {[item.kalem.doz, item.kalem.periyod, item.kalem.kullanim_sekli]
                    .filter(Boolean)
                    .join(" · ") || "Kullanım detayı yok"}
                </Text>
              ) : (
                <Text numberOfLines={3}>{item.receteMetin}</Text>
              )}
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontWeight: "700", color: colors.text },
  meta: { color: colors.muted, fontSize: 13 },
});
