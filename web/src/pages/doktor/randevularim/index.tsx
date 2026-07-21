import { useMemo, useState } from "react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

type Filtre = "bugun" | "hafta" | "tumu";

type RandevuDurum = "BEKLIYOR" | "MUAYENEDE" | "TAMAMLANDI" | "IPTAL";

type MockRandevu = {
  id: number;
  hastaAdi: string;
  saat: string;
  tarih: string;
  durum: RandevuDurum;
};

const MOCK_RANDEVULAR: MockRandevu[] = [
  {
    id: 1,
    hastaAdi: "Ayşe Yılmaz",
    saat: "09:00",
    tarih: "2026-07-21",
    durum: "BEKLIYOR",
  },
  {
    id: 2,
    hastaAdi: "Mehmet Demir",
    saat: "09:30",
    tarih: "2026-07-21",
    durum: "MUAYENEDE",
  },
  {
    id: 3,
    hastaAdi: "Zeynep Kara",
    saat: "10:15",
    tarih: "2026-07-21",
    durum: "TAMAMLANDI",
  },
  {
    id: 4,
    hastaAdi: "Ali Çelik",
    saat: "11:00",
    tarih: "2026-07-22",
    durum: "BEKLIYOR",
  },
  {
    id: 5,
    hastaAdi: "Fatma Şahin",
    saat: "14:00",
    tarih: "2026-07-23",
    durum: "BEKLIYOR",
  },
  {
    id: 6,
    hastaAdi: "Can Öztürk",
    saat: "15:30",
    tarih: "2026-07-18",
    durum: "IPTAL",
  },
];

const DURUM_ETIKET: Record<RandevuDurum, string> = {
  BEKLIYOR: "Bekliyor",
  MUAYENEDE: "Muayenede",
  TAMAMLANDI: "Tamamlandı",
  IPTAL: "İptal",
};

function durumVariant(
  durum: RandevuDurum,
): "default" | "secondary" | "destructive" | "outline" {
  switch (durum) {
    case "BEKLIYOR":
      return "default";
    case "MUAYENEDE":
      return "secondary";
    case "TAMAMLANDI":
      return "outline";
    case "IPTAL":
      return "destructive";
  }
}

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function parseDate(iso: string) {
  const [y, m, day] = iso.split("-").map(Number);
  return new Date(y, m - 1, day);
}

export function DoktorRandevularimPage() {
  const [filtre, setFiltre] = useState<Filtre>("bugun");
  const bugun = "2026-07-21";

  const liste = useMemo(() => {
    const weekStart = startOfWeek(parseDate(bugun));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    return MOCK_RANDEVULAR.filter((r) => {
      if (filtre === "tumu") return true;
      if (filtre === "bugun") return r.tarih === bugun;
      const d = parseDate(r.tarih);
      return d >= weekStart && d <= weekEnd;
    });
  }, [filtre]);

  const filtreler: { key: Filtre; label: string }[] = [
    { key: "bugun", label: "Bugün" },
    { key: "hafta", label: "Bu hafta" },
    { key: "tumu", label: "Tümü" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Randevularım
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Örnek veri — backend bağlantısı Faz 3&apos;te yapılacak
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filtreler.map((f) => (
          <Button
            key={f.key}
            type="button"
            size="sm"
            variant={filtre === f.key ? "default" : "outline"}
            onClick={() => setFiltre(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <ul className="divide-y divide-border rounded-lg border border-border bg-card">
        {liste.map((r) => (
          <li
            key={r.id}
            className={cn(
              "flex flex-wrap items-center justify-between gap-3 px-4 py-3",
            )}
          >
            <div>
              <p className="font-medium text-foreground">{r.hastaAdi}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(r.tarih).toLocaleDateString("tr-TR", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}{" "}
                · {r.saat}
              </p>
            </div>
            <Badge variant={durumVariant(r.durum)}>{DURUM_ETIKET[r.durum]}</Badge>
          </li>
        ))}
        {!liste.length && (
          <li className="px-4 py-8 text-center text-sm text-muted-foreground">
            Bu filtreye uygun randevu yok.
          </li>
        )}
      </ul>
    </div>
  );
}
