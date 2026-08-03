import { useState } from "react";
import { useAmeliyathaneler } from "@/entities/ameliyat";
import { useHastalar } from "@/entities/hasta";
import { usePersoneller } from "@/entities/personel";
import { Button } from "@/shared/ui";
import { getApiErrorMessage } from "@/shared/lib";
import { useAmeliyatPlanla } from "../api/useAmeliyatPlanla";

export function AmeliyatPlanlaForm() {
  const { data: ameliyathaneler = [] } = useAmeliyathaneler();
  const { data: hastalar = [] } = useHastalar();
  const { data: personeller = [] } = usePersoneller();
  const planla = useAmeliyatPlanla();

  const [hastaId, setHastaId] = useState("");
  const [ameliyathaneId, setAmeliyathaneId] = useState("");
  const [cerrahId, setCerrahId] = useState("");
  const [baslangic, setBaslangic] = useState("");
  const [sure, setSure] = useState("120");
  const [adi, setAdi] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(false);
    if (!hastaId || !ameliyathaneId || !cerrahId || !baslangic || !adi) {
      setErr("Zorunlu alanları doldurun.");
      return;
    }
    try {
      await planla.mutateAsync({
        hasta_id: hastaId,
        ameliyathane_id: Number(ameliyathaneId),
        sorumlu_cerrah_id: Number(cerrahId),
        planlanan_baslangic: new Date(baslangic).toISOString(),
        planlanan_sure_dk: Number(sure) || 120,
        ameliyat_adi: adi,
      });
      setOk(true);
      setAdi("");
    } catch (ex) {
      setErr(getApiErrorMessage(ex));
    }
  }

  return (
    <form
      onSubmit={submit}
      className="corporate-panel space-y-3 rounded-lg p-4"
    >
      <h3 className="text-sm font-semibold uppercase tracking-wide">
        Ameliyat planla
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
        Ameliyathane
        <select
          className="mt-1 w-full rounded border bg-background px-2 py-1.5"
          value={ameliyathaneId}
          onChange={(e) => setAmeliyathaneId(e.target.value)}
        >
          <option value="">Seçin</option>
          {ameliyathaneler.map((a) => (
            <option key={a.id} value={a.id}>
              {a.ad} ({a.oda_no}) — {a.durum}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Sorumlu cerrah (personel)
        <select
          className="mt-1 w-full rounded border bg-background px-2 py-1.5"
          value={cerrahId}
          onChange={(e) => setCerrahId(e.target.value)}
        >
          <option value="">Seçin</option>
          {personeller.map((p) => (
            <option key={p.id} value={p.id}>
              {p.sicil_no} — {p.unvan ?? "Personel"}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Planlanan başlangıç
        <input
          type="datetime-local"
          className="mt-1 w-full rounded border bg-background px-2 py-1.5"
          value={baslangic}
          onChange={(e) => setBaslangic(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        Süre (dk)
        <input
          type="number"
          min={15}
          className="mt-1 w-full rounded border bg-background px-2 py-1.5"
          value={sure}
          onChange={(e) => setSure(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        Ameliyat adı
        <input
          className="mt-1 w-full rounded border bg-background px-2 py-1.5"
          value={adi}
          onChange={(e) => setAdi(e.target.value)}
        />
      </label>
      {err ? <p className="text-sm text-destructive">{err}</p> : null}
      {ok ? (
        <p className="text-sm text-green-700 dark:text-green-400">
          Plan kaydedildi.
        </p>
      ) : null}
      <Button type="submit" disabled={planla.isPending}>
        {planla.isPending ? "Kaydediliyor…" : "Planla"}
      </Button>
    </form>
  );
}
