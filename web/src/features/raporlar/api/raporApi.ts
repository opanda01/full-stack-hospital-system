import { api } from "@/shared/api";
import { kayitDisAktarimDenetim } from "@/shared/api/denetim";

export type RaporDagilim = { etiket: string; deger: number };
export type GunlukAdet = { tarih: string; adet: number };

export type RandevuRapor = {
  baslangic: string;
  bitis: string;
  toplam: number;
  no_show: number;
  durum_dagilimi: RaporDagilim[];
  gunluk_adet: GunlukAdet[];
  departman_dagilimi: RaporDagilim[];
};

export type ServisDolulukSatir = {
  servis_id: number;
  servis_adi: string;
  dolu: number;
  toplam: number;
  oran: number;
};

export type YatisRapor = {
  aktif_yatis: number;
  ortalama_los_gun: number;
  servis_doluluk: ServisDolulukSatir[];
  gunluk_yatis: GunlukAdet[];
};

export type YatakRapor = {
  dolu: number;
  bos: number;
  temizlik_bekleyen: number;
  arizali: number;
  izolasyon_dagilimi: RaporDagilim[];
};

export type FinansRapor = {
  fatura_toplam: number;
  fatura_durum_dagilimi: RaporDagilim[];
  toplam_tutar: string;
  doner_gelir: string;
  doner_gider: string;
};

export type KlinikRapor = {
  tetkik_durum_dagilimi: RaporDagilim[];
  triyaj_renk_dagilimi: RaporDagilim[];
  sikayet_bekleyen: number;
  epikriz_onay_bekleyen: number;
  no_show_hasta: number;
};

export type RaporTur = "randevu" | "yatis" | "yatak" | "finans" | "klinik";

export type RaporFiltre = {
  baslangic?: string;
  bitis?: string;
  departman_id?: number;
  durum?: string;
};

function filtreParams(f: RaporFiltre) {
  const p: Record<string, string | number> = {};
  if (f.baslangic) p.baslangic = f.baslangic;
  if (f.bitis) p.bitis = f.bitis;
  if (f.departman_id != null) p.departman_id = f.departman_id;
  if (f.durum) p.durum = f.durum;
  return p;
}

export async function fetchRandevuRapor(f: RaporFiltre): Promise<RandevuRapor> {
  const { data } = await api.get<RandevuRapor>("/raporlar/randevu", {
    params: filtreParams(f),
  });
  return data;
}

export async function fetchYatisRapor(f: RaporFiltre): Promise<YatisRapor> {
  const { data } = await api.get<YatisRapor>("/raporlar/yatis", {
    params: filtreParams(f),
  });
  return data;
}

export async function fetchYatakRapor(): Promise<YatakRapor> {
  const { data } = await api.get<YatakRapor>("/raporlar/yatak");
  return data;
}

export async function fetchFinansRapor(f: RaporFiltre): Promise<FinansRapor> {
  const { data } = await api.get<FinansRapor>("/raporlar/finans", {
    params: filtreParams(f),
  });
  return data;
}

export async function fetchKlinikRapor(): Promise<KlinikRapor> {
  const { data } = await api.get<KlinikRapor>("/raporlar/klinik");
  return data;
}

export async function exportRapor(
  tur: RaporTur,
  format: "csv" | "pdf",
  f: RaporFiltre = {},
): Promise<void> {
  await kayitDisAktarimDenetim({
    kaynak: `rapor_${tur}`,
    kaynak_id: "export",
    format: format === "pdf" ? "PDF" : "CSV",
  });
  const params = { format, ...filtreParams(f) };
  const res = await api.get(`/raporlar/${tur}/export`, {
    params,
    responseType: "blob",
  });
  const blob = res.data as Blob;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rapor-${tur}.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}
