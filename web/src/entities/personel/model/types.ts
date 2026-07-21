export type Personel = {
  id: number;
  kullanici_id: number;
  sicil_no: string;
  departman_id: number | null;
  unvan: string | null;
  amir_id?: number | null;
  yonetim_gorevi?: string | null;
  ad?: string | null;
  soyad?: string | null;
  email?: string | null;
  rol?: string | null;
  departman_ad?: string | null;
};
