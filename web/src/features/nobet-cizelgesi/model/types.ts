export type NobetKaydi = {
  id: number;
  personel_id: number;
  personel_ad_soyad?: string | null;
  tarih: string;
  vardiya: string;
  departman_id: number;
  departman_ad?: string | null;
  cizelge_id?: number | null;
  sira?: number;
};

export type NobetPersonel = {
  id: number;
  sicil_no: string;
  unvan: string | null;
  departman_id: number | null;
  ad?: string | null;
  soyad?: string | null;
  rol?: string | null;
};

export type Departman = { id: number; ad: string };
