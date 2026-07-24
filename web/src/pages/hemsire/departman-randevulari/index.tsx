import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Button, Input } from "@/shared/ui";
import { api } from "@/shared/api";
import { formatIstanbulDateTime, getApiErrorMessage } from "@/shared/lib";

type Randevu = {
  id: number;
  hasta_id: number;
  doktor_id: number;
  departman_id: number;
  tarih_saat: string;
  durum: string;
  notlar: string | null;
  hasta_ad_soyad?: string | null;
};
type Hasta = { id: number; ad?: string | null; soyad?: string | null };
type Doktor = {
  id: number;
  ad?: string | null;
  soyad?: string | null;
  departman_id?: number | null;
};

type ZamanDilimi = "hepsi" | "bugun" | "yarin" | "gelecek_hafta" | "gecmis";

const ZAMAN: { value: ZamanDilimi; label: string }[] = [
  { value: "bugun", label: "Bugün" },
  { value: "yarin", label: "Yarın" },
  { value: "gelecek_hafta", label: "Gelecek hafta" },
  { value: "gecmis", label: "Geçmiş" },
  { value: "hepsi", label: "Tümü" },
];

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function matches(tarih: Date, dilim: ZamanDilimi) {
  const bugun = startOfDay(new Date());
  const yarin = addDays(bugun, 1);
  const otegun = addDays(bugun, 2);
  const haftaSonu = addDays(bugun, 7);
  const t = tarih.getTime();
  switch (dilim) {
    case "hepsi":
      return true;
    case "bugun":
      return t >= bugun.getTime() && t < yarin.getTime();
    case "yarin":
      return t >= yarin.getTime() && t < otegun.getTime();
    case "gelecek_hafta":
      return t >= bugun.getTime() && t < haftaSonu.getTime();
    case "gecmis":
      return t < bugun.getTime();
  }
}

export function HemsireDepartmanRandevulariPage() {
  const qc = useQueryClient();
  const [zaman, setZaman] = useState<ZamanDilimi>("bugun");
  const [arama, setArama] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [hastaId, setHastaId] = useState("");
  const [doktorId, setDoktorId] = useState("");
  const [tarihSaat, setTarihSaat] = useState("");
  const [notlar, setNotlar] = useState("");

  const { data: randevular = [], isLoading, isError, error } = useQuery({
    queryKey: ["hemsire-randevular"],
    queryFn: async () => (await api.get<Randevu[]>("/randevular/")).data,
  });
  const { data: hastalar = [] } = useQuery({
    queryKey: ["hastalar-randevu-hemsire"],
    queryFn: async () =>
      (await api.get<Hasta[]>("/hastalar/", { params: { kapsam: "tumu" } })).data,
  });
  const { data: doktorlar = [] } = useQuery({
    queryKey: ["doktorlar-list"],
    queryFn: async () => (await api.get<Doktor[]>("/doktorlar/")).data,
  });

  const filtered = useMemo(() => {
    const q = arama.trim().toLowerCase();
    return randevular.filter((r) => {
      if (!matches(new Date(r.tarih_saat), zaman)) return false;
      if (!q) return true;
      const ad = (r.hasta_ad_soyad ?? "").toLowerCase();
      return ad.includes(q) || String(r.hasta_id).includes(q);
    });
  }, [randevular, zaman, arama]);

  const createMut = useMutation({
    mutationFn: async () => {
      const dok = doktorlar.find((x) => x.id === Number(doktorId));
      const departman_id =
        dok?.departman_id ?? randevular[0]?.departman_id ?? null;
      if (!departman_id) {
        throw new Error("Departman bilgisi bulunamadı (doktor seçin)");
      }
      return api.post("/randevular/", {
        hasta_id: Number(hastaId),
        doktor_id: Number(doktorId),
        departman_id,
        tarih_saat: new Date(tarihSaat).toISOString(),
        notlar: notlar || null,
      });
    },
    onSuccess: () => {
      setErr(null);
      setHastaId("");
      setDoktorId("");
      setTarihSaat("");
      setNotlar("");
      qc.invalidateQueries({ queryKey: ["hemsire-randevular"] });
    },
    onError: (e) => setErr(getApiErrorMessage(e)),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Departman Randevuları</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Departmanınızdaki randevu kayıtları
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {ZAMAN.map((z) => (
          <Button
            key={z.value}
            size="sm"
            variant={zaman === z.value ? "default" : "outline"}
            onClick={() => setZaman(z.value)}
          >
            {z.label}
          </Button>
        ))}
        <Input
          className="max-w-xs"
          placeholder="Hasta ara…"
          value={arama}
          onChange={(e) => setArama(e.target.value)}
        />
      </div>

      <form
        className="grid max-w-xl gap-2 rounded border bg-card p-4"
        onSubmit={(e) => {
          e.preventDefault();
          createMut.mutate();
        }}
      >
        <p className="text-sm font-medium">Yeni randevu</p>
        <select
          className="rounded border px-2 py-1.5 text-sm"
          value={hastaId}
          onChange={(e) => setHastaId(e.target.value)}
          required
        >
          <option value="">Hasta…</option>
          {hastalar.map((h) => (
            <option key={h.id} value={h.id}>
              {h.ad} {h.soyad}
            </option>
          ))}
        </select>
        <select
          className="rounded border px-2 py-1.5 text-sm"
          value={doktorId}
          onChange={(e) => setDoktorId(e.target.value)}
          required
        >
          <option value="">Doktor…</option>
          {doktorlar.map((d) => (
            <option key={d.id} value={d.id}>
              {d.ad ? `${d.ad} ${d.soyad ?? ""}` : `Doktor #${d.id}`}
            </option>
          ))}
        </select>
        <Input
          type="datetime-local"
          value={tarihSaat}
          onChange={(e) => setTarihSaat(e.target.value)}
          required
        />
        <Input
          placeholder="Not (opsiyonel)"
          value={notlar}
          onChange={(e) => setNotlar(e.target.value)}
        />
        {err && <p className="text-sm text-red-600">{err}</p>}
        <Button type="submit" disabled={createMut.isPending}>
          Oluştur
        </Button>
      </form>

      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((r) => (
            <li key={r.id} className="rounded border bg-card px-3 py-2 text-sm">
              <span className="font-medium">
                {r.hasta_ad_soyad ?? `Hasta #${r.hasta_id}`}
              </span>
              {" — "}
              {formatIstanbulDateTime(r.tarih_saat)}
              {" — "}
              <span className="text-muted-foreground">{r.durum}</span>
            </li>
          ))}
          {!filtered.length && (
            <li className="text-sm text-muted-foreground">Randevu yok.</li>
          )}
        </ul>
      )}
    </div>
  );
}
