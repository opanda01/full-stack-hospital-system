export type Kullanici = {
  id: number;
  tc_kimlik_no: string;
  ad: string;
  soyad: string;
  email: string;
  telefon: string | null;
  rol: string;
  aktif_mi: boolean;
};
