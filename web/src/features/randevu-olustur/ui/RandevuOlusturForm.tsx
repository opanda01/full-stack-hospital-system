import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/shared/ui";
import { api } from "@/shared/api";
import { createRandevu } from "../api/createRandevu";

type Departman = { id: number; ad: string };
type Doktor = {
  id: number;
  uzmanlik_alani: string;
  personel_id: number;
  online_randevu_acik_mi?: boolean;
};
type Hasta = { id: number };

export function RandevuOlusturForm() {
  const qc = useQueryClient();
  const [depId, setDepId] = useState("");
  const [doktorId, setDoktorId] = useState("");
  const [slot, setSlot] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const { data: hasta } = useQuery({
    queryKey: ["hasta-ben"],
    queryFn: async () => (await api.get<Hasta>("/hastalar/ben")).data,
  });
  const { data: departmanlar = [] } = useQuery({
    queryKey: ["departmanlar"],
    queryFn: async () => (await api.get<Departman[]>("/departmanlar/")).data,
  });
  const { data: doktorlar = [] } = useQuery({
    queryKey: ["doktorlar"],
    queryFn: async () => (await api.get<Doktor[]>("/doktorlar/")).data,
  });

  const yarin = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  })();

  const { data: slots = [] } = useQuery({
    queryKey: ["slots", doktorId, yarin],
    queryFn: async () =>
      (
        await api.get<string[]>(
          `/randevular/musait?doktor_id=${doktorId}&tarih=${yarin}`,
        )
      ).data,
    enabled: Boolean(doktorId),
  });

  useEffect(() => {
    setSlot("");
  }, [doktorId]);

  const mut = useMutation({
    mutationFn: async () => {
      if (!hasta || !depId || !doktorId || !slot) {
        throw new Error("Eksik seçim");
      }
      return createRandevu({
        hastaId: hasta.id,
        doktorId: Number(doktorId),
        departmanId: Number(depId),
        tarihSaat: slot,
      });
    },
    onSuccess: () => {
      setMsg("Randevu oluşturuldu");
      qc.invalidateQueries({ queryKey: ["hasta-randevular"] });
      qc.invalidateQueries({ queryKey: ["slots"] });
    },
    onError: () => setMsg("Randevu oluşturulamadı"),
  });

  return (
    <div className="max-w-lg space-y-4 rounded border bg-white p-4">
      <div>
        <p className="mb-1 text-sm font-medium">1. Departman</p>
        <select
          className="w-full rounded border px-3 py-2"
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
      </div>
      <div>
        <p className="mb-1 text-sm font-medium">2. Doktor</p>
        <select
          className="w-full rounded border px-3 py-2"
          value={doktorId}
          onChange={(e) => setDoktorId(e.target.value)}
          disabled={!depId}
        >
          <option value="">Seçin</option>
          {doktorlar.map((d) => (
            <option key={d.id} value={d.id}>
              #{d.id} — {d.uzmanlik_alani}
            </option>
          ))}
        </select>
      </div>
      <div>
        <p className="mb-1 text-sm font-medium">3. Saat (yarın)</p>
        <div className="flex flex-wrap gap-2">
          {slots.slice(0, 16).map((s) => (
            <button
              key={s}
              type="button"
              className={`rounded border px-2 py-1 text-sm ${
                slot === s ? "border-sky-600 bg-sky-50" : ""
              }`}
              onClick={() => setSlot(s)}
            >
              {new Date(s).toLocaleTimeString("tr-TR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </button>
          ))}
          {doktorId && slots.length === 0 && (
            <p className="text-sm text-slate-500">Müsait slot yok.</p>
          )}
        </div>
      </div>
      <Button
        type="button"
        disabled={!hasta || !depId || !doktorId || !slot || mut.isPending}
        onClick={() => mut.mutate()}
      >
        Randevu oluştur
      </Button>
      {msg && <p className="text-sm text-slate-600">{msg}</p>}
    </div>
  );
}
