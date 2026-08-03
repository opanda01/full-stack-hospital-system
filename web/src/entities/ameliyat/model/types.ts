export type AmeliyathaneOzet = {
  id: number;
  ad: string;
  oda_no: string;
  durum: string;
};

export type AmeliyatPlaniOzet = {
  id: number;
  hasta_id: string;
  ameliyathane_id: number;
  sorumlu_cerrah_id: number;
  planlanan_baslangic: string;
  planlanan_sure_dk: number;
  gercek_baslangic: string | null;
  gercek_bitis: string | null;
  durum: string;
  ameliyat_adi: string;
  iptal_gerekcesi: string | null;
};

export type AmeliyathaneTakvimOgesi = {
  ameliyat_plani_id: number;
  ameliyat_adi: string;
  hasta_id: string;
  planlanan_baslangic: string;
  planlanan_sure_dk: number;
  durum: string;
  sorumlu_cerrah_id: number;
};

export type AmeliyathaneTakvim = {
  ameliyathane_id: number;
  gun: string;
  ogeler: AmeliyathaneTakvimOgesi[];
};
