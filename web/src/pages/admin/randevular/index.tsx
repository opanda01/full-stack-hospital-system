import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { AppShell, Button, Input } from "@/shared/ui";
import { api } from "@/shared/api";
import { formatIstanbulDateTime, getApiErrorMessage } from "@/shared/lib";
import { roleRootFromPath } from "@/shared/lib/role-root";
import { RandevuIptalEtButton } from "@/features/randevu-iptal-et";
import type { Randevu } from "@/entities/randevu";
import type { Doktor } from "@/entities/doktor";
import { AdminRandevuOlusturForm } from "./AdminRandevuOlusturForm";

type Hasta = { id: number; tc_kimlik_no: string; kullanici_id: number };
type Kullanici = { id: number; ad: string; soyad: string };
type Departman = { id: number; ad: string };

const DURUMLAR = ["BEKLEMEDE", "TAMAMLANDI", "IPTAL"] as const;

type ZamanDilimi =
  | "hepsi"
  | "bugun"
  | "yarin"
  | "gelecek_hafta"
  | "onumuzdeki_ay"
  | "gecmis";

const ZAMAN_SECENEKLERI: { value: ZamanDilimi; label: string }[] = [
  { value: "hepsi", label: "Tümü" },
  { value: "bugun", label: "Bugün" },
  { value: "yarin", label: "Yarın" },
  { value: "gelecek_hafta", label: "Gelecek hafta" },
  { value: "onumuzdeki_ay", label: "Gelecek ay" },
  { value: "gecmis", label: "Geçmiş" },
];

/** Exclusive buckets for grouped "Tümü" view (no double-counting). */
const GRUP_SIRASI: { id: ZamanDilimi; label: string }[] = [
  { id: "bugun", label: "Bugün" },
  { id: "yarin", label: "Yarın" },
  { id: "gelecek_hafta", label: "Gelecek 7 gün" },
  { id: "onumuzdeki_ay", label: "Gelecek ay" },
  { id: "hepsi", label: "Daha sonra" },
  { id: "gecmis", label: "Geçmiş" },
];

function normalize(s: string) {
  return s.trim().toLocaleLowerCase("tr-TR");
}

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

function buildRanges(now = new Date()) {
  const bugun = startOfDay(now);
  const yarin = addDays(bugun, 1);
  const otegun = addDays(bugun, 2);
  /** Bugünden itibaren 7 gün (bugün dahil). */
  const haftaSonu = addDays(bugun, 7);
  /** Bugünden itibaren 1 ay (bugün dahil). */
  const aySonu = addMonths(bugun, 1);

  return { bugun, yarin, otegun, haftaSonu, aySonu };
}

function inRange(t: number, start: Date, end: Date) {
  return t >= start.getTime() && t < end.getTime();
}

function matchesZaman(
  tarih: Date,
  dilim: ZamanDilimi,
  ranges: ReturnType<typeof buildRanges>,
): boolean {
  const t = tarih.getTime();
  switch (dilim) {
    case "hepsi":
      return true;
    case "bugun":
      return inRange(t, ranges.bugun, ranges.yarin);
    case "yarin":
      return inRange(t, ranges.yarin, ranges.otegun);
    case "gelecek_hafta":
      return inRange(t, ranges.bugun, ranges.haftaSonu);
    case "onumuzdeki_ay":
      return inRange(t, ranges.bugun, ranges.aySonu);
    case "gecmis":
      return t < ranges.bugun.getTime();
    default:
      return true;
  }
}

/** Exclusive group so an appointment appears in only one section. */
function exclusiveGroup(
  tarih: Date,
  ranges: ReturnType<typeof buildRanges>,
): ZamanDilimi {
  const t = tarih.getTime();
  if (t < ranges.bugun.getTime()) return "gecmis";
  if (inRange(t, ranges.bugun, ranges.yarin)) return "bugun";
  if (inRange(t, ranges.yarin, ranges.otegun)) return "yarin";
  if (inRange(t, ranges.otegun, ranges.haftaSonu)) return "gelecek_hafta";
  if (inRange(t, ranges.haftaSonu, ranges.aySonu)) return "onumuzdeki_ay";
  return "hepsi"; // daha sonra
}

export function AdminRandevularPage() {
  const roleRoot = roleRootFromPath(useLocation().pathname);
  const [arama, setArama] = useState("");
  const [durumFiltre, setDurumFiltre] = useState("");
  const [departmanFiltre, setDepartmanFiltre] = useState("");
  const [doktorFiltre, setDoktorFiltre] = useState("");
  const [zamanDilimi, setZamanDilimi] = useState<ZamanDilimi>("gelecek_hafta");

  const {
    data: randevular = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["randevular"],
    queryFn: async () => (await api.get<Randevu[]>("/randevular/")).data,
  });

  const { data: doktorlar = [] } = useQuery({
    queryKey: ["doktorlar"],
    queryFn: async () => (await api.get<Doktor[]>("/doktorlar/")).data,
  });

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

  const ranges = useMemo(() => buildRanges(), []);

  const doktorById = useMemo(() => {
    const map = new Map<number, Doktor>();
    for (const d of doktorlar) map.set(d.id, d);
    return map;
  }, [doktorlar]);

  const hastaLabelById = useMemo(() => {
    const kullaniciById = new Map(kullanicilar.map((k) => [k.id, k]));
    const map = new Map<number, string>();
    for (const h of hastalar) {
      const k = kullaniciById.get(h.kullanici_id);
      map.set(
        h.id,
        k ? `${k.ad} ${k.soyad}` : `Hasta #${h.id} (${h.tc_kimlik_no})`,
      );
    }
    return map;
  }, [hastalar, kullanicilar]);

  const departmanById = useMemo(() => {
    const map = new Map<number, string>();
    for (const d of departmanlar) map.set(d.id, d.ad);
    return map;
  }, [departmanlar]);

  const doktorOptions = useMemo(
    () =>
      doktorlar.map((d) => {
        const ad =
          `${d.ad ?? ""} ${d.soyad ?? ""}`.trim() ||
          d.uzmanlik_alani ||
          `Doktor #${d.id}`;
        return { value: String(d.id), label: ad };
      }),
    [doktorlar],
  );

  const baseFiltered = useMemo(() => {
    const q = normalize(arama);
    return randevular.filter((r) => {
      if (durumFiltre && r.durum !== durumFiltre) return false;
      if (departmanFiltre && String(r.departman_id) !== departmanFiltre) {
        return false;
      }
      if (doktorFiltre && String(r.doktor_id) !== doktorFiltre) return false;

      if (!q) return true;
      const doktor = doktorById.get(r.doktor_id);
      const doktorAd = doktor
        ? `${doktor.ad ?? ""} ${doktor.soyad ?? ""}`.trim() ||
          doktor.uzmanlik_alani
        : "";
      const haystack = normalize(
        [
          String(r.id),
          hastaLabelById.get(r.hasta_id) ?? "",
          doktorAd,
          departmanById.get(r.departman_id) ?? "",
          r.durum,
          r.notlar ?? "",
          new Date(r.tarih_saat).toLocaleString("tr-TR", {
            timeZone: "Europe/Istanbul",
          }),
        ].join(" "),
      );
      return haystack.includes(q);
    });
  }, [
    randevular,
    arama,
    durumFiltre,
    departmanFiltre,
    doktorFiltre,
    doktorById,
    hastaLabelById,
    departmanById,
  ]);

  const zamanSayilari = useMemo(() => {
    const counts: Record<ZamanDilimi, number> = {
      hepsi: baseFiltered.length,
      bugun: 0,
      yarin: 0,
      gelecek_hafta: 0,
      onumuzdeki_ay: 0,
      gecmis: 0,
    };
    for (const r of baseFiltered) {
      const t = new Date(r.tarih_saat);
      for (const key of Object.keys(counts) as ZamanDilimi[]) {
        if (key === "hepsi") continue;
        if (matchesZaman(t, key, ranges)) counts[key] += 1;
      }
    }
    return counts;
  }, [baseFiltered, ranges]);

  const filtered = useMemo(() => {
    const list = baseFiltered.filter((r) =>
      matchesZaman(new Date(r.tarih_saat), zamanDilimi, ranges),
    );
    return list.sort(
      (a, b) =>
        new Date(a.tarih_saat).getTime() - new Date(b.tarih_saat).getTime(),
    );
  }, [baseFiltered, zamanDilimi, ranges]);

  const grouped = useMemo(() => {
    if (zamanDilimi !== "hepsi") return null;
    const buckets = new Map<ZamanDilimi, Randevu[]>();
    for (const g of GRUP_SIRASI) buckets.set(g.id, []);
    for (const r of filtered) {
      const id = exclusiveGroup(new Date(r.tarih_saat), ranges);
      buckets.get(id)?.push(r);
    }
    return GRUP_SIRASI.map((g) => ({
      ...g,
      items: buckets.get(g.id) ?? [],
    })).filter((g) => g.items.length > 0);
  }, [filtered, zamanDilimi, ranges]);

  const filtreAktif =
    Boolean(arama.trim()) ||
    Boolean(durumFiltre) ||
    Boolean(departmanFiltre) ||
    Boolean(doktorFiltre) ||
    zamanDilimi !== "gelecek_hafta";

  const renderRow = (r: Randevu) => {
    const doktor = doktorById.get(r.doktor_id);
    const doktorAd = doktor
      ? `${doktor.ad ?? ""} ${doktor.soyad ?? ""}`.trim() ||
        doktor.uzmanlik_alani
      : `#${r.doktor_id}`;
    return (
      <tr key={r.id} className="border-b">
        <td className="py-2">
          {formatIstanbulDateTime(r.tarih_saat)}
        </td>
        <td>{hastaLabelById.get(r.hasta_id) ?? `#${r.hasta_id}`}</td>
        <td>{doktorAd}</td>
        <td>{departmanById.get(r.departman_id) ?? `#${r.departman_id}`}</td>
        <td>{r.durum}</td>
        <td>
          {r.durum !== "IPTAL" && <RandevuIptalEtButton randevuId={r.id} />}
        </td>
      </tr>
    );
  };

  const tableHead = (
    <thead>
      <tr className="border-b text-left">
        <th className="py-2">Tarih</th>
        <th>Hasta</th>
        <th>Doktor</th>
        <th>Departman</th>
        <th>Durum</th>
        <th />
      </tr>
    </thead>
  );

  return (
    <AppShell title="Randevular" links={[{ to: roleRoot, label: "Ana" }]}>
      <AdminRandevuOlusturForm />

      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600" role="alert">
          {getApiErrorMessage(error)}
        </p>
      ) : randevular.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz randevu yok.</p>
      ) : (
        <>
          <div className="mb-4 space-y-3 rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Zaman dilimi">
              {ZAMAN_SECENEKLERI.map((z) => {
                const active = zamanDilimi === z.value;
                const count = zamanSayilari[z.value];
                return (
                  <button
                    key={z.value}
                    type="button"
                    onClick={() => setZamanDilimi(z.value)}
                    className={
                      active
                        ? "rounded-md border border-primary bg-primary px-3 py-1.5 text-sm text-primary-foreground"
                        : "rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground hover:bg-muted"
                    }
                  >
                    {z.label}
                    <span
                      className={
                        active
                          ? "ml-1.5 opacity-80"
                          : "ml-1.5 text-muted-foreground"
                      }
                    >
                      ({count})
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <label className="min-w-[200px] flex-1 space-y-1 text-sm">
                <span className="text-muted-foreground">Ara</span>
                <Input
                  value={arama}
                  onChange={(e) => setArama(e.target.value)}
                  placeholder="Hasta, doktor, departman, tarih…"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Durum</span>
                <select
                  className="block min-w-[140px] rounded-md border border-border bg-background px-3 py-2"
                  value={durumFiltre}
                  onChange={(e) => setDurumFiltre(e.target.value)}
                >
                  <option value="">Tümü</option>
                  {DURUMLAR.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Departman</span>
                <select
                  className="block min-w-[160px] rounded-md border border-border bg-background px-3 py-2"
                  value={departmanFiltre}
                  onChange={(e) => setDepartmanFiltre(e.target.value)}
                >
                  <option value="">Tümü</option>
                  {departmanlar.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.ad}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Doktor</span>
                <select
                  className="block min-w-[180px] rounded-md border border-border bg-background px-3 py-2"
                  value={doktorFiltre}
                  onChange={(e) => setDoktorFiltre(e.target.value)}
                >
                  <option value="">Tümü</option>
                  {doktorOptions.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </label>
              {filtreAktif && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setArama("");
                    setDurumFiltre("");
                    setDepartmanFiltre("");
                    setDoktorFiltre("");
                    setZamanDilimi("gelecek_hafta");
                  }}
                >
                  Temizle
                </Button>
              )}
            </div>
          </div>

          <p className="mb-2 text-sm text-muted-foreground">
            {filtered.length} / {randevular.length} randevu
          </p>

          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Filtreye uyan randevu yok.
            </p>
          ) : zamanDilimi === "hepsi" && grouped ? (
            <div className="space-y-6">
              {grouped.map((g) => (
                <section key={g.id}>
                  <h3 className="mb-2 text-sm font-semibold">
                    {g.label}{" "}
                    <span className="font-normal text-muted-foreground">
                      ({g.items.length})
                    </span>
                  </h3>
                  <table className="w-full border-collapse text-sm">
                    {tableHead}
                    <tbody>{g.items.map(renderRow)}</tbody>
                  </table>
                </section>
              ))}
            </div>
          ) : (
            <table className="w-full border-collapse text-sm">
              {tableHead}
              <tbody>{filtered.map(renderRow)}</tbody>
            </table>
          )}
        </>
      )}
    </AppShell>
  );
}
