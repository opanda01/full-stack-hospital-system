import type { Randevu } from "@/entities/randevu";
import {
  addDaysIso,
  gunEtiketi,
  mondayOfWeek,
  weekDays,
} from "@/features/nobet-cizelgesi/lib/week";
import { formatIstanbulTime } from "@/shared/lib";

export function bugunIstanbulIso(now = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" });
}

export type ZamanDilimi =
  | "hepsi"
  | "bugun"
  | "yarin"
  | "gelecek_hafta"
  | "onumuzdeki_ay"
  | "gecmis";

export function istanbulDateKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", {
    timeZone: "Europe/Istanbul",
  });
}

export function randevuSaatKey(iso: string): string {
  return formatIstanbulTime(iso);
}

export function cellKey(gun: string, saat: string) {
  return `${gun}|${saat}`;
}

export type CizelgePanel = {
  baslik: string;
  gunler: string[];
  randevular: Randevu[];
};

export type DayRanges = {
  bugunIso: string;
  yarinIso: string;
  otegunIso: string;
  haftaSonuIso: string;
  aySonuIso: string;
};

export function buildDayRanges(now = new Date()): DayRanges {
  const bugunIso = bugunIstanbulIso(now);
  return {
    bugunIso,
    yarinIso: addDaysIso(bugunIso, 1),
    otegunIso: addDaysIso(bugunIso, 2),
    haftaSonuIso: addDaysIso(bugunIso, 7),
    aySonuIso: addDaysIso(bugunIso, 31),
  };
}

function daysInclusive(startIso: string, endIsoExclusive: string): string[] {
  const out: string[] = [];
  let cur = startIso;
  for (let i = 0; i < 62 && cur < endIsoExclusive; i++) {
    out.push(cur);
    cur = addDaysIso(cur, 1);
  }
  return out;
}

function weekPanelsFromDays(days: string[]): { gunler: string[]; baslik: string }[] {
  const weekMap = new Map<string, string[]>();
  for (const day of days) {
    const mon = mondayOfWeek(new Date(`${day}T12:00:00`));
    if (!weekMap.has(mon)) weekMap.set(mon, weekDays(mon));
  }
  return [...weekMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mon, gunler]) => ({
      gunler,
      baslik: `Hafta · ${gunEtiketi(mon)} – ${gunEtiketi(gunler[6])}`,
    }));
}

function filterRandevuOnDays(randevular: Randevu[], gunler: string[]): Randevu[] {
  const set = new Set(gunler);
  return randevular.filter((r) => set.has(istanbulDateKey(r.tarih_saat)));
}

/** Zaman filtresine göre nöbet tarzı haftalık / günlük çizelge panelleri. */
export function cizelgePanelleri(
  randevular: Randevu[],
  zaman: ZamanDilimi,
  ranges = buildDayRanges(),
): CizelgePanel[] {
  const bugunIso = ranges.bugunIso;

  if (zaman === "bugun") {
    const gunler = [bugunIso];
    return [
      {
        baslik: gunEtiketi(bugunIso),
        gunler,
        randevular: filterRandevuOnDays(randevular, gunler),
      },
    ];
  }
  if (zaman === "yarin") {
    const gun = ranges.yarinIso;
    return [
      {
        baslik: gunEtiketi(gun),
        gunler: [gun],
        randevular: filterRandevuOnDays(randevular, [gun]),
      },
    ];
  }
  if (zaman === "gelecek_hafta") {
    const gunler = Array.from({ length: 7 }, (_, i) => addDaysIso(bugunIso, i));
    return [
      {
        baslik: `${gunEtiketi(gunler[0])} – ${gunEtiketi(gunler[6])}`,
        gunler,
        randevular: filterRandevuOnDays(randevular, gunler),
      },
    ];
  }
  if (zaman === "onumuzdeki_ay") {
    const gunler = daysInclusive(bugunIso, ranges.aySonuIso);
    return weekPanelsFromDays(gunler).map((w) => ({
      ...w,
      randevular: filterRandevuOnDays(randevular, w.gunler),
    }));
  }

  const gunSet = new Set<string>();
  for (const r of randevular) gunSet.add(istanbulDateKey(r.tarih_saat));
  const days = [...gunSet].sort();
  if (days.length === 0) return [];

  return weekPanelsFromDays(days).map((w) => ({
    ...w,
    randevular: filterRandevuOnDays(randevular, w.gunler),
  }));
}

export function saatSatirlari(randevular: Randevu[]): string[] {
  const set = new Set<string>();
  for (const r of randevular) set.add(randevuSaatKey(r.tarih_saat));
  return [...set].sort((a, b) => a.localeCompare(b, "tr"));
}

export function randevularByCell(randevular: Randevu[]): Map<string, Randevu[]> {
  const m = new Map<string, Randevu[]>();
  for (const r of randevular) {
    const key = cellKey(istanbulDateKey(r.tarih_saat), randevuSaatKey(r.tarih_saat));
    const list = m.get(key);
    if (list) list.push(r);
    else m.set(key, [r]);
  }
  for (const list of m.values()) {
    list.sort(
      (a, b) =>
        new Date(a.tarih_saat).getTime() - new Date(b.tarih_saat).getTime(),
    );
  }
  return m;
}

export function matchesZaman(
  tarih: Date | string,
  dilim: ZamanDilimi,
  ranges = buildDayRanges(),
): boolean {
  const key =
    typeof tarih === "string"
      ? istanbulDateKey(tarih)
      : istanbulDateKey(tarih.toISOString());
  const { bugunIso, haftaSonuIso, aySonuIso } = ranges;
  switch (dilim) {
    case "hepsi":
      return true;
    case "bugun":
      return key === bugunIso;
    case "yarin":
      return key === ranges.yarinIso;
    case "gelecek_hafta":
      return key >= bugunIso && key < haftaSonuIso;
    case "onumuzdeki_ay":
      return key >= bugunIso && key < aySonuIso;
    case "gecmis":
      return key < bugunIso;
  }
}
