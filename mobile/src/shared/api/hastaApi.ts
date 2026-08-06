import { apiFetch, fetchMe, type MeResponse } from "@/shared/api/http";
import type {
  AlerjiDto,
  EpikrizDto,
  HastaBelgeDto,
  HastaDto,
  HastaOzetDto,
  HastaProfilUpdate,
  HastaYatisOzetDto,
  KlinikOnayDto,
  MuayeneDto,
  Page,
  RandevuDto,
  ReceteKalemDto,
  SikayetOneriDto,
  TetkikDto,
  TetkikTrendNoktaDto,
} from "@/shared/api/types";
import { unwrapPage } from "@/shared/api/types";

async function parseError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { detail?: string | { msg?: string }[] };
    if (typeof body.detail === "string") return body.detail;
    if (Array.isArray(body.detail) && body.detail[0]?.msg) {
      return body.detail[0].msg!;
    }
  } catch {
    /* ignore */
  }
  return `İstek başarısız (${res.status})`;
}

export async function fetchPage<T>(
  path: string,
  page = 1,
  pageSize = 20,
): Promise<Page<T>> {
  const sep = path.includes("?") ? "&" : "?";
  const res = await apiFetch(
    `${path}${sep}page=${page}&page_size=${pageSize}`,
  );
  if (!res.ok) throw new Error(await parseError(res));
  const body = (await res.json()) as Page<T> | T[];
  if (Array.isArray(body)) {
    return {
      items: body,
      total: body.length,
      page: 1,
      page_size: body.length,
    };
  }
  return body;
}

export async function fetchRandevular(page = 1, pageSize = 20) {
  return fetchPage<RandevuDto>("/randevular/", page, pageSize);
}

export async function fetchMuayeneler(page = 1, pageSize = 50) {
  return fetchPage<MuayeneDto>("/muayeneler/", page, pageSize);
}

export async function fetchMuayeneById(id: number): Promise<MuayeneDto> {
  const res = await apiFetch(`/muayeneler/${id}`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function fetchTetkikler(page = 1, pageSize = 20) {
  return fetchPage<TetkikDto>("/tetkikler/", page, pageSize);
}

export async function fetchTetkik(id: string): Promise<TetkikDto> {
  const res = await apiFetch(`/tetkikler/${id}`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function fetchTetkikTrend(
  hastaId: string,
  parametre: string,
  limit = 20,
): Promise<TetkikTrendNoktaDto[]> {
  const q = new URLSearchParams({
    hasta_id: hastaId,
    parametre,
    limit: String(limit),
  });
  const res = await apiFetch(`/tetkikler/trend?${q}`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function fetchHastaBen(): Promise<HastaDto> {
  const res = await apiFetch("/hastalar/ben");
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function updateHastaProfil(
  input: HastaProfilUpdate,
): Promise<HastaDto> {
  const res = await apiFetch("/hastalar/ben", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function fetchAlerjilerim(): Promise<AlerjiDto[]> {
  const res = await apiFetch("/hastalar/ben/alerjiler");
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function fetchEpikrizler(page = 1, pageSize = 20) {
  return fetchPage<EpikrizDto>("/epikriz/", page, pageSize);
}

export async function fetchEpikriz(id: number): Promise<EpikrizDto> {
  const res = await apiFetch(`/epikriz/${id}`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function fetchBelgeDetay(
  id: number,
  kaynak?: string,
): Promise<{ epikriz: EpikrizDto | null; klinik: KlinikOnayDto | null }> {
  if (kaynak === "KLINIK_ONAY") {
    const res = await apiFetch(`/klinik-onay/${id}`);
    if (!res.ok) throw new Error("Belge yüklenemedi");
    return { epikriz: null, klinik: await res.json() };
  }
  return { epikriz: await fetchEpikriz(id), klinik: null };
}

export async function fetchTetkikDetayBundle(id: string): Promise<{
  item: TetkikDto;
  trend: TetkikTrendNoktaDto[];
}> {
  const item = await fetchTetkik(id);
  let trend: TetkikTrendNoktaDto[] = [];
  const firstParam = item.sonuc_kalemleri?.find((k) => k.parametre_adi)
    ?.parametre_adi;
  if (firstParam && item.hasta_id) {
    try {
      trend = await fetchTetkikTrend(item.hasta_id, firstParam);
    } catch {
      trend = [];
    }
  }
  return { item, trend };
}

export async function postSikayetOneri(input: {
  tur: "SIKAYET" | "ONERI";
  icerik: string;
}): Promise<SikayetOneriDto> {
  const res = await apiFetch("/sikayet-oneri/", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function fetchKlinikOnaylar(page = 1, pageSize = 50) {
  return fetchPage<KlinikOnayDto>("/klinik-onay/", page, pageSize);
}

export async function fetchBelgeler(page = 1, pageSize = 20) {
  return fetchPage<HastaBelgeDto>("/hastalar/ben/belgeler", page, pageSize);
}

export async function fetchHastaOzet(): Promise<HastaOzetDto> {
  const res = await apiFetch("/hastalar/ben/ozet");
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function fetchSikayetBenim(page = 1, pageSize = 20) {
  return fetchPage<SikayetOneriDto>("/sikayet-oneri/benim", page, pageSize);
}

export async function fetchOzetSnapshot(): Promise<{
  me: MeResponse;
  ozet: HastaOzetDto;
}> {
  const [me, ozet] = await Promise.all([fetchMe(), fetchHastaOzet()]);
  return { me, ozet };
}

export type ProfilBundle = {
  me: MeResponse;
  hasta: HastaDto | null;
  alerjiler: AlerjiDto[];
  yatis: HastaYatisOzetDto | null;
};

export async function fetchProfilBundle(): Promise<ProfilBundle> {
  const [me, hasta, alerjiler, ozet] = await Promise.all([
    fetchMe(),
    fetchHastaBen().catch(() => null),
    fetchAlerjilerim().catch(() => [] as AlerjiDto[]),
    fetchHastaOzet().catch(() => null),
  ]);
  return {
    me,
    hasta,
    alerjiler,
    yatis: ozet?.yatis ?? null,
  };
}

export type ReceteSatirDto = {
  key: string;
  muayeneId: number | null;
  klinikId: number | null;
  baslik: string;
  tani: string | null;
  kalem: ReceteKalemDto | null;
  receteMetin: string | null;
};

export async function fetchRecetelerimSatirlari(): Promise<ReceteSatirDto[]> {
  const [muayenePage, klinikPage] = await Promise.all([
    fetchMuayeneler(1, 100),
    fetchKlinikOnaylar(1, 50),
  ]);
  const rows: ReceteSatirDto[] = [];
  for (const k of klinikPage.items.filter((x) => x.tur === "RECETE")) {
    rows.push({
      key: `ko-${k.id}`,
      muayeneId: k.muayene_id,
      klinikId: k.id,
      baslik: "Onaylı reçete",
      tani: null,
      kalem: null,
      receteMetin: k.icerik,
    });
  }
  for (const m of muayenePage.items) {
    if (m.recete_kalemleri?.length) {
      for (const kalem of m.recete_kalemleri) {
        rows.push({
          key: `k-${kalem.id}`,
          muayeneId: m.id,
          klinikId: null,
          baslik: kalem.urun_adi,
          tani: m.tani,
          kalem,
          receteMetin: null,
        });
      }
    } else if (m.receteler?.trim()) {
      rows.push({
        key: `m-${m.id}`,
        muayeneId: m.id,
        klinikId: null,
        baslik: "Reçete (muayene)",
        tani: m.tani,
        kalem: null,
        receteMetin: m.receteler,
      });
    }
  }
  return rows;
}

export type RandevuAlBootstrap = {
  hastaId: string;
  departmanlar: { id: number; ad: string }[];
  doktorlar: {
    id: number;
    uzmanlik_alani: string;
    ad: string | null;
    soyad: string | null;
    departman_id: number | null;
    online_randevu_acik_mi: boolean;
  }[];
};

export async function fetchRandevuAlBootstrap(): Promise<RandevuAlBootstrap> {
  const [hRes, dRes, dokRes] = await Promise.all([
    apiFetch("/hastalar/ben"),
    apiFetch("/departmanlar/"),
    apiFetch("/doktorlar/?page_size=200"),
  ]);
  if (!hRes.ok) throw new Error("Hasta kaydı alınamadı");
  if (!dRes.ok) throw new Error("Departmanlar yüklenemedi");
  if (!dokRes.ok) throw new Error("Doktorlar yüklenemedi");
  const mine = (await hRes.json()) as { id: string };
  const dokBody = await dokRes.json();
  return {
    hastaId: mine.id,
    departmanlar: await dRes.json(),
    doktorlar: Array.isArray(dokBody) ? dokBody : (dokBody.items ?? []),
  };
}

export { unwrapPage };
