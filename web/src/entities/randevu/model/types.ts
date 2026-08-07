export type Randevu = {
  id: string;
  hasta_id: string;
  doktor_id: number;
  departman_id: number;
  tarih_saat: string;
  durum: string;
  notlar: string | null;
  hasta_ad_soyad?: string | null;
  medula_provizyon_no?: string | null;
  medula_takip_no?: string | null;
  mhrs_randevu_id?: string | null;
};
