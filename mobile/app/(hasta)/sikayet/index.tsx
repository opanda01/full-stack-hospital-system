import { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Switch,
} from "react-native";
import { router } from "expo-router";
import { postSikayetOneri, fetchSikayetBenim } from "@/shared/api/hastaApi";
import type { SikayetOneriDto } from "@/shared/api/types";
import {
  Card,
  ErrorText,
  PrimaryButton,
  Screen,
  SectionTitle,
  colors,
} from "@/shared/ui";

export default function SikayetScreen() {
  const [oneriMi, setOneriMi] = useState(false);
  const [icerik, setIcerik] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [gecmis, setGecmis] = useState<SikayetOneriDto[]>([]);

  useEffect(() => {
    void fetchSikayetBenim(1, 20)
      .then((p) => setGecmis(p.items))
      .catch(() => setGecmis([]));
  }, [ok]);

  const gonder = async () => {
    setHata(null);
    setOk(null);
    if (icerik.trim().length < 10) {
      setHata("En az 10 karakter yazın");
      return;
    }
    setLoading(true);
    try {
      await postSikayetOneri({
        tur: oneriMi ? "ONERI" : "SIKAYET",
        icerik: icerik.trim(),
      });
      setOk("Talebiniz alındı");
      setIcerik("");
    } catch (e) {
      setHata(e instanceof Error ? e.message : "Gönderilemedi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <SectionTitle>Şikayet / öneri</SectionTitle>
      <View style={styles.row}>
        <Text style={styles.label}>Öneri olarak gönder</Text>
        <Switch value={oneriMi} onValueChange={setOneriMi} />
      </View>
      <TextInput
        style={styles.input}
        multiline
        numberOfLines={6}
        placeholder="Mesajınız…"
        value={icerik}
        onChangeText={setIcerik}
        textAlignVertical="top"
      />
      <ErrorText>{hata}</ErrorText>
      {ok ? <Text style={styles.ok}>{ok}</Text> : null}
      <PrimaryButton
        label={loading ? "Gönderiliyor…" : "Gönder"}
        disabled={loading}
        onPress={() => void gonder()}
      />
      <Pressable onPress={() => router.back()} style={{ marginTop: 12 }}>
        <Text style={styles.link}>Geri</Text>
      </Pressable>

      <SectionTitle>Taleplerim</SectionTitle>
      {gecmis.length ? (
        gecmis.map((g) => (
          <Card key={g.id}>
            <Text style={styles.label}>
              {g.tur} · {g.durum}
            </Text>
            <Text style={styles.gecmisIcerik}>{g.icerik}</Text>
          </Card>
        ))
      ) : (
        <Text style={styles.meta}>Henüz kayıt yok</Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  label: { color: colors.text, fontWeight: "500" },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    backgroundColor: colors.surface,
    marginBottom: 12,
    color: colors.text,
  },
  ok: { color: colors.success, marginBottom: 8 },
  link: { color: colors.accent, textAlign: "center" },
  meta: { color: colors.muted, fontSize: 13 },
  gecmisIcerik: { color: colors.text, marginTop: 4 },
});
