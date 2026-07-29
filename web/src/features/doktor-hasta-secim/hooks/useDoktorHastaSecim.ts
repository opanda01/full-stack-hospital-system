import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/shared/api";
import {
  LOOKUP_PAGE_SIZE,
  formatIstanbulTime,
  unwrapPage,
  type PageResponse,
} from "@/shared/lib";
import { randevuHastaAdi, type Randevu } from "@/entities/randevu";

export type DoktorHastaRow = {
  id: string;
  ad?: string | null;
  soyad?: string | null;
  tc_kimlik_no?: string;
};

export type HastaSecimModu = "gun" | "tum";

function istanbulDateKey(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" });
}

export function todayIstanbul(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" });
}

export function useDoktorHastaSecim(initialHastaId = "") {
  const [hastaModu, setHastaModu] = useState<HastaSecimModu>("gun");
  const [hastaTarih, setHastaTarih] = useState(todayIstanbul);
  const [hastaId, setHastaId] = useState(initialHastaId);

  const { data: hastalar = [] } = useQuery({
    queryKey: ["hastalar-benim"],
    queryFn: async () =>
      unwrapPage(
        (
          await api.get<PageResponse<DoktorHastaRow>>("/hastalar/benim", {
            params: { page_size: LOOKUP_PAGE_SIZE },
          })
        ).data,
      ),
  });

  const { data: randevular = [] } = useQuery({
    queryKey: ["randevular"],
    queryFn: async () =>
      unwrapPage(
        (
          await api.get<PageResponse<Randevu>>("/randevular/", {
            params: { page_size: LOOKUP_PAGE_SIZE },
          })
        ).data,
      ),
  });

  const hastaLabel = useMemo(() => {
    const m = new Map<string, string>();
    for (const h of hastalar) {
      m.set(h.id, `${h.ad ?? ""} ${h.soyad ?? ""}`.trim() || `Hasta #${h.id}`);
    }
    return m;
  }, [hastalar]);

  const hastaSecenekleri = useMemo(() => {
    if (hastaModu === "tum") {
      return hastalar.map((h) => {
        const ad =
          `${h.ad ?? ""} ${h.soyad ?? ""}`.trim() || `Hasta #${h.id}`;
        const tc = h.tc_kimlik_no ?? "";
        return {
          value: h.id,
          label: tc ? `${ad} · ${tc}` : ad,
          searchText: `${ad} ${tc} ${h.id}`,
        };
      });
    }
    const gunRandevular = randevular
      .filter(
        (r) =>
          r.durum !== "IPTAL" && istanbulDateKey(r.tarih_saat) === hastaTarih,
      )
      .sort(
        (a, b) =>
          new Date(a.tarih_saat).getTime() - new Date(b.tarih_saat).getTime(),
      );
    const seen = new Set<string>();
    const opts: { value: string; label: string; searchText?: string }[] = [];
    for (const r of gunRandevular) {
      if (seen.has(r.hasta_id)) continue;
      seen.add(r.hasta_id);
      const ad = randevuHastaAdi(r);
      opts.push({
        value: r.hasta_id,
        label: `${formatIstanbulTime(r.tarih_saat)} — ${ad}`,
        searchText: `${ad} ${r.hasta_id}`,
      });
    }
    return opts;
  }, [hastaModu, hastalar, randevular, hastaTarih]);

  useEffect(() => {
    if (!hastaId) return;
    if (!hastaSecenekleri.some((o) => o.value === hastaId)) {
      setHastaId("");
    }
  }, [hastaId, hastaSecenekleri]);

  const switchModu = (modu: HastaSecimModu) => {
    setHastaModu(modu);
    setHastaId("");
  };

  const changeTarih = (iso: string) => {
    setHastaTarih(iso);
    setHastaId("");
  };

  return {
    hastaId,
    setHastaId,
    hastaModu,
    switchModu,
    hastaTarih,
    changeTarih,
    hastaSecenekleri,
    hastaLabel,
  };
}

/** Liste / tablo filtreleri — seçim yoksa gün modunda o günün randevulu hastaları. */
export function useDoktorHastaListeFiltresi(
  initialHastaId = "",
  options?: { gunModuDaraltListe?: boolean },
) {
  const gunModuDaraltListe = options?.gunModuDaraltListe ?? true;
  const secim = useDoktorHastaSecim(initialHastaId);

  const gunHastaIds = useMemo(() => {
    if (secim.hastaModu !== "gun") return null;
    return new Set(secim.hastaSecenekleri.map((o) => o.value));
  }, [secim.hastaModu, secim.hastaSecenekleri]);

  const matchHastaId = useCallback(
    (id: string) => {
      if (secim.hastaId) return id === secim.hastaId;
      if (!gunModuDaraltListe) return true;
      if (secim.hastaModu === "gun" && gunHastaIds) {
        if (gunHastaIds.size === 0) return false;
        return gunHastaIds.has(id);
      }
      return true;
    },
    [secim.hastaId, secim.hastaModu, gunHastaIds, gunModuDaraltListe],
  );

  return { ...secim, matchHastaId };
}
