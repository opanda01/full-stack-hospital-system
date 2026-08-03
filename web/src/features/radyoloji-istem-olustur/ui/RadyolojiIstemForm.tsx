import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useHastalar } from "@/entities/hasta";
import { Button } from "@/shared/ui";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";
import { useRadyolojiIstemOlustur } from "../api/useRadyolojiIstemOlustur";

const TURLER = ["ROENTGEN", "BT", "MR", "USG", "MAMOGRAFI"] as const;

type Props = {
  isteyenDoktorId: number;
};

export function RadyolojiIstemForm({ isteyenDoktorId }: Props) {
  const { data: hastalar = [] } = useHastalar();
  const olustur = useRadyolojiIstemOlustur();
  const [hastaId, setHastaId] = useState("");
  const [tur, setTur] = useState<string>("ROENTGEN");
  const [bolge, setBolge] = useState("");
  const [acil, setAcil] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(false);
    if (!hastaId || !bolge.trim()) {
      setErr("Hasta ve vücut bölgesi zorunlu.");
      return;
    }
    try {
      await olustur.mutateAsync({
        hasta_id: hastaId,
        isteyen_doktor_id: isteyenDoktorId,
        tetkik_turu: tur,
        vucut_bolgesi: bolge.trim(),
        aciliyet: acil ? "ACIL" : "RUTIN",
      });
      setOk(true);
      setBolge("");
    } catch (ex) {
      setErr(getApiErrorMessage(ex));
    }
  }

  return (
    <form onSubmit={submit} className="corporate-panel space-y-3 rounded-lg p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide">
        Radyoloji istemi
      </h3>
      <label className="block text-sm">
        Hasta
        <select
          className="mt-1 w-full rounded border bg-background px-2 py-1.5"
          value={hastaId}
          onChange={(e) => setHastaId(e.target.value)}
        >
          <option value="">Seçin</option>
          {hastalar.map((h) => (
            <option key={h.id} value={h.id}>
              {h.ad} {h.soyad}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Modalite
        <select
          className="mt-1 w-full rounded border bg-background px-2 py-1.5"
          value={tur}
          onChange={(e) => setTur(e.target.value)}
        >
          {TURLER.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Vücut bölgesi
        <input
          className="mt-1 w-full rounded border bg-background px-2 py-1.5"
          value={bolge}
          onChange={(e) => setBolge(e.target.value)}
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={acil}
          onChange={(e) => setAcil(e.target.checked)}
        />
        Acil
      </label>
      {err ? <p className="text-sm text-destructive">{err}</p> : null}
      {ok ? (
        <p className="text-sm text-green-700 dark:text-green-400">İstem oluşturuldu.</p>
      ) : null}
      <Button type="submit" disabled={olustur.isPending}>
        {olustur.isPending ? "Gönderiliyor…" : "İstem oluştur"}
      </Button>
    </form>
  );
}

export function RadyolojiIstemOlusturPanel() {
  const { data: doktor } = useQuery({
    queryKey: ["doktor-ben"],
    queryFn: async () => (await api.get<{ id: number }>("/doktorlar/ben")).data,
  });
  if (!doktor?.id) {
    return (
      <p className="text-sm text-muted-foreground">
        Doktor profili yüklenemedi.
      </p>
    );
  }
  return <RadyolojiIstemForm isteyenDoktorId={doktor.id} />;
}
