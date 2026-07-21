import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell, Button } from "@/shared/ui";
import { api } from "@/shared/api";

type Randevu = { id: number; durum: string; tarih_saat: string; hasta_id: number };
type Doktor = { id: number };

export function DoktorMuayeneEkraniPage() {
  const qc = useQueryClient();
  const { data: randevular = [] } = useQuery({
    queryKey: ["randevularim"],
    queryFn: async () => (await api.get<Randevu[]>("/randevular/")).data,
  });
  const { data: doktor } = useQuery({
    queryKey: ["doktor-ben"],
    queryFn: async () => (await api.get<Doktor>("/doktorlar/ben")).data,
  });
  const [randevuId, setRandevuId] = useState("");
  const [tani, setTani] = useState("");
  const [tedavi, setTedavi] = useState("");
  const [tetkikTuru, setTetkikTuru] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const muayene = useMutation({
    mutationFn: async () =>
      api.post("/muayeneler/", {
        randevu_id: Number(randevuId),
        tani,
        tedavi_plani: tedavi,
        receteler: null,
      }),
    onSuccess: () => {
      setMsg("Muayene kaydedildi");
      setTani("");
      setTedavi("");
      qc.invalidateQueries({ queryKey: ["randevularim"] });
    },
    onError: () => setMsg("Muayene kaydedilemedi"),
  });

  const tetkik = useMutation({
    mutationFn: async () => {
      const r = randevular.find((x) => x.id === Number(randevuId));
      return api.post("/tetkikler/", {
        hasta_id: r!.hasta_id,
        istek_yapan_doktor_id: doktor!.id,
        tetkik_turu: tetkikTuru,
      });
    },
    onSuccess: () => {
      setMsg("Tetkik isteği oluşturuldu");
      setTetkikTuru("");
    },
    onError: () => setMsg("Tetkik isteği oluşturulamadı"),
  });

  return (
    <AppShell
      title="Muayene Ekranı"
      links={[
        { to: "/doktor/randevularim", label: "Randevular" },
        { to: "/sikayet", label: "Şikayet" },
      ]}
    >
      <div className="max-w-lg space-y-3 rounded border bg-card p-4">
        {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
        <select
          className="w-full rounded border px-3 py-2"
          value={randevuId}
          onChange={(e) => setRandevuId(e.target.value)}
        >
          <option value="">Randevu seç</option>
          {randevular
            .filter((r) => r.durum !== "IPTAL")
            .map((r) => (
              <option key={r.id} value={r.id}>
                #{r.id} · {new Date(r.tarih_saat).toLocaleString("tr-TR")} · 
                {r.durum}
              </option>
            ))}
        </select>
        <textarea
          className="w-full rounded border px-3 py-2"
          placeholder="Tanı"
          value={tani}
          onChange={(e) => setTani(e.target.value)}
        />
        <textarea
          className="w-full rounded border px-3 py-2"
          placeholder="Tedavi planı"
          value={tedavi}
          onChange={(e) => setTedavi(e.target.value)}
        />
        <Button
          type="button"
          onClick={() => muayene.mutate()}
          disabled={!randevuId || !tani || muayene.isPending}
        >
          Muayene kaydet
        </Button>
        <hr />
        <input
          className="w-full rounded border px-3 py-2"
          placeholder="Tetkik türü (örn. Tam kan sayımı)"
          value={tetkikTuru}
          onChange={(e) => setTetkikTuru(e.target.value)}
        />
        <Button
          type="button"
          onClick={() => tetkik.mutate()}
          disabled={!randevuId || !tetkikTuru || !doktor || tetkik.isPending}
        >
          Tetkik iste
        </Button>
      </div>
    </AppShell>
  );
}
