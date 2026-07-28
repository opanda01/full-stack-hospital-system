import { apiFetch, fetchMe, type MeResponse } from "@/shared/api/http";
import type {
  AlerjiDto,
  EpikrizDto,
  HastaDto,
  HastaProfilUpdate,
  MuayeneDto,
  Page,
  RandevuDto,
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
  const page = await fetchMuayeneler(1, 100);
  const found = page.items.find((m) => m.id === id);
  if (!found) throw new Error("Muayene bulunamadı");
  return found;
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

export async function fetchOzetSnapshot(): Promise<{
  me: MeResponse;
  yaklasanRandevu: RandevuDto | null;
  sonTetkik: TetkikDto | null;
  yeniSonucSayisi: number;
  yaklasanRandevuSayisi: number;
}> {
  const [me, randevular, tetkikler] = await Promise.all([
    fetchMe(),
    fetchRandevular(1, 20),
    fetchTetkikler(1, 20),
  ]);
  const now = Date.now();
  const aktif = unwrapPage(randevular).filter((r) => r.durum !== "IPTAL");
  const yaklasanlar = aktif
    .filter((r) => new Date(r.tarih_saat).getTime() >= now - 60_000)
    .sort(
      (a, b) =>
        new Date(a.tarih_saat).getTime() - new Date(b.tarih_saat).getTime(),
    );
  const tetkikItems = unwrapPage(tetkikler);
  const yeniSonucSayisi = tetkikItems.filter(
    (t) => t.durum === "SONUCLANDI",
  ).length;
  return {
    me,
    yaklasanRandevu: yaklasanlar[0] ?? null,
    sonTetkik: tetkikItems[0] ?? null,
    yeniSonucSayisi,
    yaklasanRandevuSayisi: yaklasanlar.length,
  };
}

export { unwrapPage };
