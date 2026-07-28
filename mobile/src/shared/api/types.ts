export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
};

export function unwrapPage<T>(data: Page<T> | T[]): T[] {
  if (Array.isArray(data)) return data;
  return data?.items ?? [];
}

export type RandevuDto = {
  id: string;
  tarih_saat: string;
  durum: string;
  doktor_id: number;
  departman_id: number;
  hasta_ad_soyad: string | null;
};

export type ReceteKalemDto = {
  id: number;
  muayene_id: number;
  ilac_id: number | null;
  urun_adi: string;
  barkod: string | null;
  doz: string | null;
  periyod: string | null;
  kullanim_sekli: string | null;
  adet: number | null;
  sira: number;
};

export type MuayeneDto = {
  id: number;
  randevu_id: number;
  tani: string | null;
  tedavi_plani: string | null;
  receteler: string | null;
  recete_kalemleri: ReceteKalemDto[];
};

export type TetkikSonucKalemDto = {
  id: number;
  parametre_adi: string;
  loinc_kodu: string | null;
  deger_sayisal: number | null;
  deger_metin: string | null;
  birim: string | null;
  ref_min: number | null;
  ref_max: number | null;
  anormal_mi: boolean;
};

export type TetkikDto = {
  id: string;
  hasta_id: string;
  istek_yapan_doktor_id: number;
  tetkik_turu: string;
  sonuc_dosyasi: string | null;
  durum: string;
  created_at?: string | null;
  sonuc_kalemleri?: TetkikSonucKalemDto[];
};

export type TetkikTrendNoktaDto = {
  tetkik_id: string;
  tarih: string | null;
  deger_sayisal: number | null;
  deger_metin: string | null;
  birim: string | null;
  anormal_mi: boolean;
};

export type HastaDto = {
  id: string;
  kullanici_id: number;
  tc_kimlik_no: string;
  dogum_tarihi: string | null;
  cinsiyet: string | null;
  kan_grubu: string | null;
  adres: string | null;
  boy_cm: number | null;
  kilo_kg: number | null;
  ad: string | null;
  soyad: string | null;
  telefon: string | null;
};

export type HastaProfilUpdate = {
  dogum_tarihi?: string | null;
  cinsiyet?: string | null;
  kan_grubu?: string | null;
  adres?: string | null;
  boy_cm?: number | null;
  kilo_kg?: number | null;
  telefon?: string | null;
};

export type AlerjiDto = {
  id: number;
  hasta_id: number;
  allerjen_tipi: string;
  allerjen_kodu: string | null;
  allerjen_adi: string;
  siddet: string;
  notlar: string | null;
};

export type EpikrizDto = {
  id: number;
  yatis_id: number;
  hasta_id: string;
  yazar_id: number;
  durum: string;
  sikayet_oyku: string | null;
  fizik_muayene: string | null;
  tani: string | null;
  tedavi_ozeti: string | null;
  taburcu_onerileri: string | null;
  onaylayan_doktor_id: number | null;
  onaylandi_at: string | null;
  created_at: string | null;
};

export type SikayetOneriDto = {
  id: number;
  gonderen_kullanici_id: number;
  tur: string;
  icerik: string;
  tarih: string;
  durum: string;
};
