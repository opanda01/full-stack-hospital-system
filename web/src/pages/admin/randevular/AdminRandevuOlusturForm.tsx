import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/shared/ui";
import { api } from "@/shared/api";
import { formatIstanbulTime, getApiErrorMessage } from "@/shared/lib";
import { createRandevu } from "@/features/randevu-olustur/api/createRandevu";

type Departman = { id: number; ad: string };
type Doktor = {
  id: number;
  uzmanlik_alani: string;
  ad?: string | null;
  soyad?: string | null;
};
type Hasta = { id: number; tc_kimlik_no: string; kullanici_id: number };
type Kullanici = { id: number; ad: string; soyad: string };

/** Admin: hasta seçerek randevu oluşturur. */
export function AdminRandevuOlusturForm() {
  const qc = useQueryClient();
  const [hastaId, setHastaId] = useState("");
  const [depId, setDepId] = useState("");
  const [doktorId, setDoktorId] = useState("");
  const [tarih, setTarih] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [slot, setSlot] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const { data: hastalar = [] } = useQuery({
    queryKey: ["hastalar"],
    queryFn: async () => (await api.get<Hasta[]>("/hastalar/")).data,
  });
  const { data: kullanicilar = [] } = useQuery({
    queryKey: ["kullanicilar"],
    queryFn: async () => (await api.get<Kullanici[]>("/kullanicilar/")).data,
  });
  const { data: departmanlar = [] } = useQuery({
    queryKey: ["departmanlar"],
    queryFn: async () => (await api.get<Departman[]>("/departmanlar/")).data,
  });
  const { data: doktorlar = [] } = useQuery({
    queryKey: ["doktorlar"],
    queryFn: async () => (await api.get<Doktor[]>("/doktorlar/")).data,
  });

  const { data: slots = [] } = useQuery({
    queryKey: ["slots", doktorId, tarih],
    queryFn: async () =>
      (
        await api.get<string[]>(
          `/randevular/musait?doktor_id=${doktorId}&tarih=${tarih}`,
        )
      ).data,
    enabled: Boolean(doktorId && tarih),
  });

  useEffect(() => {
    setSlot("");
  }, [doktorId, tarih]);

  const hastaOptions = hastalar.map((h) => {
    const k = kullanicilar.find((u) => u.id === h.kullanici_id);
    const ad = k ? `${k.ad} ${k.soyad}` : `Hasta #${h.id}`;
    return { id: h.id, label: `${ad} (${h.tc_kimlik_no})` };
  });

  const mut = useMutation({
    mutationFn: async () => {
      if (!hastaId || !depId || !doktorId || !slot) {
        throw new Error("Eksik seçim");
      }
      return createRandevu({
        hastaId: Number(hastaId),
        doktorId: Number(doktorId),
        departmanId: Number(depId),
        tarihSaat: slot,
      });
    },
    onSuccess: () => {
      setOk("Randevu oluşturuldu");
      setHata(null);
      setSlot("");
      qc.invalidateQueries({ queryKey: ["randevular"] });
      qc.invalidateQueries({ queryKey: ["slots"] });
    },
    onError: (err) => {
      setOk(null);
      setHata(getApiErrorMessage(err));
    },
  });

  return (
    <div className="mb-6 space-y-3 rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold">Yeni randevu</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block space-y-1 text-sm">
          <span className="text-muted-foreground">Hasta</span>
          <select
            className="w-full rounded-md border border-border px-3 py-2"
            value={hastaId}
            onChange={(e) => setHastaId(e.target.value)}
          >
            <option value="">Seçin</option>
            {hastaOptions.map((h) => (
              <option key={h.id} value={h.id}>
                {h.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-muted-foreground">Departman</span>
          <select
            className="w-full rounded-md border border-border px-3 py-2"
            value={depId}
            onChange={(e) => {
              setDepId(e.target.value);
              setDoktorId("");
            }}
          >
            <option value="">Seçin</option>
            {departmanlar.map((d) => (
              <option key={d.id} value={d.id}>
                {d.ad}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-muted-foreground">Doktor</span>
          <select
            className="w-full rounded-md border border-border px-3 py-2"
            value={doktorId}
            onChange={(e) => setDoktorId(e.target.value)}
            disabled={!depId}
          >
            <option value="">Seçin</option>
            {doktorlar.map((d) => (
              <option key={d.id} value={d.id}>
                {`${d.ad ?? ""} ${d.soyad ?? ""}`.trim() || `#${d.id}`} —{" "}
                {d.uzmanlik_alani}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-muted-foreground">Tarih</span>
          <input
            type="date"
            className="w-full rounded-md border border-border px-3 py-2"
            value={tarih}
            onChange={(e) => setTarih(e.target.value)}
          />
        </label>
      </div>
      <div>
        <p className="mb-1 text-sm text-muted-foreground">Müsait saat</p>
        <div className="flex flex-wrap gap-2">
          {slots.slice(0, 24).map((s) => (
            <button
              key={s}
              type="button"
              className={`rounded-md border px-2 py-1 text-sm ${
                slot === s
                  ? "border-[var(--border-accent)] bg-[var(--card-success-bg)]"
                  : "border-border"
              }`}
              onClick={() => setSlot(s)}
            >
              {formatIstanbulTime(s)}
            </button>
          ))}
          {doktorId && slots.length === 0 && (
            <p className="text-sm text-muted-foreground">Müsait slot yok.</p>
          )}
        </div>
      </div>
      <Button
        type="button"
        disabled={!hastaId || !depId || !doktorId || !slot || mut.isPending}
        onClick={() => mut.mutate()}
      >
        {mut.isPending ? "Kaydediliyor…" : "Randevu oluştur"}
      </Button>
      {hata && (
        <p className="text-sm text-red-600" role="alert">
          {hata}
        </p>
      )}
      {ok && <p className="text-sm text-muted-foreground">{ok}</p>}
    </div>
  );
}
