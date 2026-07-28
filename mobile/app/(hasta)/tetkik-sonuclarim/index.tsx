import { useCallback, useMemo, useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { fetchTetkikler } from "@/shared/api/hastaApi";
import type { TetkikDto } from "@/shared/api/types";
import { go } from "@/shared/nav";
import {
  Card,
  EmptyText,
  ErrorText,
  Loading,
  Screen,
  colors,
} from "@/shared/ui";

type IstekGrubu = {
  key: string;
  doktorId: number;
  label: string;
  items: TetkikDto[];
};

type TarihGrubu = {
  key: string;
  label: string;
  sortKey: string;
  istekler: IstekGrubu[];
  toplam: number;
};

function tarihKey(iso: string | null | undefined): string {
  if (!iso) return "bilinmeyen";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "bilinmeyen";
  return d.toISOString().slice(0, 10);
}

function tarihLabel(key: string): string {
  if (key === "bilinmeyen") return "Tarih bilinmiyor";
  const d = new Date(`${key}T12:00:00`);
  return d.toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function durumEtiket(durum: string): string {
  if (durum === "SONUCLANDI") return "Sonuçlandı";
  if (durum === "ISTEK_ALINDI") return "İstek alındı";
  return durum;
}

function groupTetkikler(items: TetkikDto[]): TarihGrubu[] {
  const byDate = new Map<string, TetkikDto[]>();
  for (const t of items) {
    const k = tarihKey(t.created_at);
    const list = byDate.get(k) ?? [];
    list.push(t);
    byDate.set(k, list);
  }

  const groups: TarihGrubu[] = [];
  for (const [key, list] of byDate.entries()) {
    const byDoktor = new Map<number, TetkikDto[]>();
    for (const t of list) {
      const dList = byDoktor.get(t.istek_yapan_doktor_id) ?? [];
      dList.push(t);
      byDoktor.set(t.istek_yapan_doktor_id, dList);
    }
    const istekler: IstekGrubu[] = [...byDoktor.entries()].map(
      ([doktorId, dokItems]) => ({
        key: `${key}-d${doktorId}`,
        doktorId,
        label: `İstek grubu · Doktor #${doktorId}`,
        items: dokItems,
      }),
    );
    groups.push({
      key,
      label: tarihLabel(key),
      sortKey: key === "bilinmeyen" ? "0000-00-00" : key,
      istekler,
      toplam: list.length,
    });
  }

  return groups.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
}

export default function TetkikSonuclarimScreen() {
  const [items, setItems] = useState<TetkikDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [hata, setHata] = useState<string | null>(null);
  const [openDate, setOpenDate] = useState<string | null>(null);
  const [openIstek, setOpenIstek] = useState<string | null>(null);

  const groups = useMemo(() => groupTetkikler(items), [items]);

  const refresh = useCallback(async () => {
    setHata(null);
    try {
      // Hasta ekranında tarih grupları için yeterli kayıt çek
      const body = await fetchTetkikler(1, 100);
      setItems(body.items);
      setOpenDate(null);
      setOpenIstek(null);
    } catch {
      setHata("Sunucuya bağlanılamadı");
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
        data={groups}
        keyExtractor={(g) => g.key}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => void refresh()} />
        }
        ListEmptyComponent={<EmptyText>Tetkik sonucu yok</EmptyText>}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item: gun }) => {
          const dateOpen = openDate === gun.key;
          return (
            <View style={styles.block}>
              <Pressable
                style={[styles.dateHeader, dateOpen && styles.dateHeaderOpen]}
                onPress={() => {
                  setOpenDate(dateOpen ? null : gun.key);
                  setOpenIstek(null);
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.dateTitle}>{gun.label}</Text>
                </View>
                <Text style={styles.chevron}>{dateOpen ? "▾" : "▸"}</Text>
              </Pressable>

              {dateOpen
                ? gun.istekler.map((istek) => {
                    const istekOpen = openIstek === istek.key;
                    return (
                      <View key={istek.key} style={styles.istekWrap}>
                        <Pressable
                          style={styles.istekHeader}
                          onPress={() =>
                            setOpenIstek(istekOpen ? null : istek.key)
                          }
                        >
                          <Text style={styles.istekTitle}>{istek.label}</Text>
                          <Text style={styles.dateMeta}>
                            {istek.items.length} kalem {istekOpen ? "▾" : "▸"}
                          </Text>
                        </Pressable>
                        {istekOpen
                          ? istek.items.map((t) => (
                              <Pressable
                                key={t.id}
                                onPress={() =>
                                  go(`/(hasta)/tetkik-sonuclarim/${t.id}`)
                                }
                              >
                                <Card style={styles.itemCard}>
                                  <Text style={styles.cardTitle}>
                                    {t.tetkik_turu}
                                  </Text>
                                  <Text style={styles.meta}>
                                    {durumEtiket(t.durum)}
                                  </Text>
                                  <Text style={styles.meta} numberOfLines={1}>
                                    {t.sonuc_dosyasi ?? "Sonuç bekleniyor"}
                                  </Text>
                                </Card>
                              </Pressable>
                            ))
                          : null}
                      </View>
                    );
                  })
                : null}
            </View>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { marginBottom: 10 },
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 10,
  },
  dateHeaderOpen: { borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },
  dateTitle: { color: "#fff", fontWeight: "700", fontSize: 15 },
  dateMeta: { color: "#bae6fd", fontSize: 12, marginTop: 2 },
  chevron: { color: "#fff", fontSize: 18, fontWeight: "700" },
  istekWrap: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopWidth: 0,
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  istekHeader: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 2,
  },
  istekTitle: { fontWeight: "600", color: colors.text },
  itemCard: { marginTop: 8, marginBottom: 0 },
  cardTitle: { fontWeight: "700", color: colors.text },
  meta: { color: colors.muted, fontSize: 13 },
});
