/** Geçici mock kullanıcılar — VITE_USE_MOCK_AUTH=true iken. */

export type MockUser = {
  id: string;
  email: string;
  sifre: string;
  ad: string;
  soyad: string;
  rol: string;
  /** Sicil no — kimlik ile giriş */
  sicil_no?: string;
  kullanici_adi?: string;
  sifre_degistirmeli_mi?: boolean;
  kvkk_onaylandi_mi?: boolean;
};

export const MOCK_USERS: MockUser[] = [
  {
    id: "1",
    email: "admin@hastane.test",
    sifre: "Test1234!",
    ad: "Sistem",
    soyad: "Admin",
    rol: "ADMIN",
    sicil_no: "ADM-001",
    kullanici_adi: "admin",
    kvkk_onaylandi_mi: true,
  },
  {
    id: "2",
    email: "bashekim@hastane.test",
    sifre: "Test1234!",
    ad: "Test",
    soyad: "Başhekim",
    rol: "BASHEKIM",
    sicil_no: "BH-001",
    kullanici_adi: "bashekim",
    kvkk_onaylandi_mi: true,
  },
  {
    id: "3",
    email: "doktor@hastane.test",
    sifre: "Test1234!",
    ad: "Ufuk",
    soyad: "Öztürk",
    rol: "DOKTOR",
    sicil_no: "D-001",
    kullanici_adi: "doktor",
    kvkk_onaylandi_mi: true,
  },
  {
    id: "4",
    email: "hemsire@hastane.example.com",
    sifre: "Test1234!",
    ad: "Test",
    soyad: "Hemşire",
    rol: "HEMSIRE",
    sicil_no: "H-001",
    kullanici_adi: "hemsire",
    kvkk_onaylandi_mi: true,
  },
  {
    id: "5",
    email: "laborant@hastane.test",
    sifre: "Test1234!",
    ad: "Test",
    soyad: "Laborant",
    rol: "LABORANT",
    sicil_no: "L-001",
    kullanici_adi: "laborant",
    kvkk_onaylandi_mi: true,
  },
  {
    id: "6",
    email: "temizlik@hastane.test",
    sifre: "Test1234!",
    ad: "Test",
    soyad: "Temizlik",
    rol: "TEMIZLIK_PERSONELI",
    sicil_no: "T-001",
    kullanici_adi: "temizlik",
    kvkk_onaylandi_mi: true,
  },
  {
    id: "7",
    email: "mudur@hastane.test",
    sifre: "Test1234!",
    ad: "Test",
    soyad: "Müdür",
    rol: "MUDUR",
    sicil_no: "M-001",
    kullanici_adi: "mudur",
    kvkk_onaylandi_mi: true,
  },
  {
    id: "8",
    email: "ebe@hastane.example.com",
    sifre: "Test1234!",
    ad: "Test",
    soyad: "Ebe",
    rol: "EBE",
    sicil_no: "E-001",
    kullanici_adi: "ebe",
    kvkk_onaylandi_mi: true,
  },
  {
    id: "9",
    email: "guvenlik@hastane.example.com",
    sifre: "Test1234!",
    ad: "Test",
    soyad: "Güvenlik",
    rol: "GUVENLIK",
    sicil_no: "G-001",
    kullanici_adi: "guvenlik",
    kvkk_onaylandi_mi: true,
  },
  {
    id: "10",
    email: "idari@hastane.test",
    sifre: "Test1234!",
    ad: "Test",
    soyad: "İdari",
    rol: "IDARI_PERSONEL",
    sicil_no: "I-001",
    kullanici_adi: "idari",
    kvkk_onaylandi_mi: true,
  },
  {
    id: "11",
    email: "hasta@hastane.test",
    sifre: "Test1234!",
    ad: "Test",
    soyad: "Hasta",
    rol: "HASTA",
    kvkk_onaylandi_mi: true,
  },
  {
    id: "12",
    email: "yeni@hastane.test",
    sifre: "Temp1234!",
    ad: "Yeni",
    soyad: "Personel",
    rol: "HEMSIRE",
    sicil_no: "H-YENI",
    kullanici_adi: "yeni.personel",
    sifre_degistirmeli_mi: true,
    kvkk_onaylandi_mi: false,
  },
];
