export type RadyolojiIstem = {
  id: number;
  hasta_id: string;
  hasta_ad_soyad?: string | null;
  isteyen_doktor_id: number;
  isteyen_doktor_ad_soyad?: string | null;
  muayene_id: number | null;
  tetkik_turu: string;
  vucut_bolgesi: string;
  aciliyet: string;
  durum: string;
  istem_zamani: string;
  sonuc?: {
    orthanc_study_instance_uid: string;
    rapor_metni: string;
    rapor_zamani: string;
  } | null;
};

export type RadyolojiGoruntuLink = {
  istem_id: number;
  study_instance_uid: string | null;
  viewer_url: string | null;
};
