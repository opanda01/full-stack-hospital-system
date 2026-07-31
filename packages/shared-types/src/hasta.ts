/** Hasta mobil API tipleri — OpenAPI generate ile senkron tutulmalı. */
export type HastaBelgeDto = {
  kaynak: "EPIKRIZ" | "KLINIK_ONAY";
  id: number;
  tur: string | null;
  baslik: string;
  ozet: string | null;
  durum: string;
  tarih: string | null;
};

export type HastaYatisOzetDto = {
  aktif_mi: boolean;
  yatis_id: number | null;
  protokol_no: string | null;
  servis_adi: string | null;
  yatak_no: string | null;
  oda_no: string | null;
  yatis_tarihi: string | null;
  taburcu_tarihi: string | null;
};

export type HastaOzetDto = {
  ad_soyad: string;
  yaklasan_randevu: {
    id: string;
    tarih_saat: string;
    durum: string;
    doktor_ad_soyad?: string | null;
    departman_ad?: string | null;
  } | null;
  yaklasan_randevu_sayisi: number;
  son_tetkik_turu: string | null;
  son_tetkik_durum: string | null;
  son_tetkik_tarih: string | null;
  okunmamis_sonuc_sayisi: number;
  yatis: HastaYatisOzetDto | null;
};
