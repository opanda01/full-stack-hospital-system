export type Doktor = {
  id: number;
  personel_id: number;
  uzmanlik_alani: string;
  diploma_no: string;
  online_randevu_acik_mi: boolean;
  ad?: string | null;
  soyad?: string | null;
  email?: string | null;
  sicil_no?: string | null;
  departman_id?: number | null;
  departman_ad?: string | null;
};
