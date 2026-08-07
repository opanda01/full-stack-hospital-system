export type YatakDurumu =
  | "BOS"
  | "DOLU"
  | "TEMIZLIK_BEKLIYOR"
  | "ARIZALI";

export type ServisOzet = {
  id: number;
  ad: string;
  kod: string;
  tip: string;
  kat_no: number | null;
  departman_id: number | null;
};

export type YatakOzet = {
  id: number;
  oda_id: number;
  oda_no: string | null;
  servis_id: number | null;
  yatak_no: string;
  durum: YatakDurumu | string;
  izolasyon_tipi?: string;
};

export type ServisDolulukOzet = {
  servis_id: number;
  bos: number;
  dolu: number;
  temizlik_bekliyor: number;
  arizali: number;
  toplam: number;
};
