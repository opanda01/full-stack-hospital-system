export type Randevu = {
  id: string;
  hasta_id: string;
  doktor_id: number;
  departman_id: number;
  tarih_saat: string;
  durum: string;
  notlar: string | null;
};
