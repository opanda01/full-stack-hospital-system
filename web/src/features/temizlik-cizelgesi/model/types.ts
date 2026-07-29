export type TemizlikGorev = {
  id: number;
  personel_id: number;
  personel_ad_soyad?: string | null;
  oda_bolum: string;
  gorev_tarihi: string;
  durum: string;
};

export type TemizlikPersonel = {
  id: number;
  sicil_no: string;
  unvan: string | null;
  ad?: string | null;
  soyad?: string | null;
  rol?: string | null;
};
