import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button, Input } from "@/shared/ui";
import { api } from "@/shared/api";
import { formatIstanbulDateTime, getApiErrorMessage } from "@/shared/lib";
import { RandevuIptalEtButton } from "@/features/randevu-iptal-et";

type Randevu = {
  id: number;
  hasta_id: number;
  durum: string;
  tarih_saat: string;
  notlar: string | null;
};
type Hasta = { id: number; ad?: string | null; soyad?: string | null; tc_kimlik_no: string };

type ZamanDilimi =
  | "hepsi"
  | "bugun"
  | "yarin"
  | "gelecek_hafta"
  | "onumuzdeki_ay"
  | "gecmis";

const ZAMAN: { value: ZamanDilimi; label: string }[] = [
  { value: "bugun", label: "Bugün" },
  { value: "yarin", label: "Yarın" },
  { value: "gelecek_hafta", label: "Gelecek hafta" },
  { value: "onumuzdeki_ay", label: "Gelecek ay" },
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
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, d.getDate());
}
function inRange(t: number, a: Date, b: Date) {
  return t >= a.getTime() && t < b.getTime();
}
function matches(tarih: Date, dilim: ZamanDilimi) {
  const bugun = startOfDay(new Date());
  const yarin = addDays(bugun, 1);
  const otegun = addDays(bugun, 2);
  const haftaSonu = addDays(bugun, 7);
  const aySonu = addMonths(bugun, 1);
  const t = tarih.getTime();
  switch (dilim) {
    case "hepsi":
      return true;
    case "bugun":
      return inRange(t, bugun, yarin);
    case "yarin":
      return inRange(t, yarin, otegun);
    case "gelecek_hafta":
      return inRange(t, bugun, haftaSonu);
    case "onumuzdeki_ay":
      return inRange(t, bugun, aySonu);
    case "gecmis":
      return t < bugun.getTime();
  }
}

export function DoktorRandevularimPage() {
  const [zaman, setZaman] = useState<ZamanDilimi>("bugun");
  const [arama, setArama] = useState("");
  const [durumFiltre, setDurumFiltre] = useState("");

  const {
    data: randevular = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["randevular"],
    queryFn: async () => (await api.get<Randevu[]>("/randevular/")).data,
  });
  const { data: hastalar = [] } = useQuery({
    queryKey: ["hastalar-benim"],
    queryFn: async () => (await api.get<Hasta[]>("/hastalar/benim")).data,
  });

  const hastaLabel = useMemo(() => {
    const m = new Map<number, string>();
    for (const h of hastalar) {
      const ad = `${h.ad ?? ""} ${h.soyad ?? ""}`.trim();
      m.set(h.id, ad || `Hasta #${h.id}`);
    }
    return m;
  }, [hastalar]);

  const filtered = useMemo(() => {
    const q = arama.trim().toLocaleLowerCase("tr-TR");
    return randevular
      .filter((r) => matches(new Date(r.tarih_saat), zaman))
      .filter((r) => !durumFiltre || r.durum === durumFiltre)
      .filter((r) => {
        if (!q) return true;
        const hay = `${hastaLabel.get(r.hasta_id) ?? ""} ${r.durum} ${r.id}`.toLocaleLowerCase(
          "tr-TR",
        );
        return hay.includes(q);
      })
      .sort(
        (a, b) =>
          new Date(a.tarih_saat).getTime() - new Date(b.tarih_saat).getTime(),
      );
  }, [randevular, zaman, durumFiltre, arama, hastaLabel]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Randevularım</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Yalnızca size ait randevular
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {ZAMAN.map((z) => (
          <Button
            key={z.value}
            type="button"
            size="sm"
            variant={zaman === z.value ? "default" : "outline"}
            onClick={() => setZaman(z.value)}
          >
            {z.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          className="max-w-xs"
          placeholder="Hasta ara…"
          value={arama}
          onChange={(e) => setArama(e.target.value)}
        />
        <select
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={durumFiltre}
          onChange={(e) => setDurumFiltre(e.target.value)}
        >
          <option value="">Tüm durumlar</option>
          <option value="BEKLEMEDE">BEKLEMEDE</option>
          <option value="TAMAMLANDI">TAMAMLANDI</option>
          <option value="IPTAL">IPTAL</option>
        </select>
      </div>

      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Filtreye uyan randevu yok.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {filtered.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div>
                <p className="font-medium">
                  {hastaLabel.get(r.hasta_id) ?? `Hasta #${r.hasta_id}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatIstanbulDateTime(r.tarih_saat)} · {r.durum}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {r.durum === "BEKLEMEDE" && (
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/doktor/muayene?randevu=${r.id}`}>Muayene</Link>
                  </Button>
                )}
                {r.durum !== "IPTAL" && (
                  <RandevuIptalEtButton randevuId={r.id} />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
