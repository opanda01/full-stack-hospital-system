export type Randevu = {
  id: number;
  hasta_id: number;
  doktor_id: number;
  departman_id: number;
  tarih_saat: string;
  durum: string;
  notlar: string | null;
};
