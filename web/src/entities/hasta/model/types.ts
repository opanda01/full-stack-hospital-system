export type Hasta = {
  id: string;
  kullanici_id: number;
  tc_kimlik_no: string;
  dogum_tarihi: string | null;
  cinsiyet: string | null;
  kan_grubu: string | null;
  adres: string | null;
  ad?: string | null;
  soyad?: string | null;
  email?: string | null;
  telefon?: string | null;
  aktif_mi?: boolean | null;
};
