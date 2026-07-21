/** Geçici mock kullanıcılar — backend hazır olunca VITE_USE_MOCK_AUTH=false yeterli. */

export type MockUser = {
  id: string;
  email: string;
  sifre: string;
  ad: string;
  soyad: string;
  rol: string;
};

export const MOCK_USERS: MockUser[] = [
  {
    id: "1",
    email: "admin@hastane.test",
    sifre: "Test1234!",
    ad: "Sistem",
    soyad: "Admin",
    rol: "ADMIN",
  },
  {
    id: "2",
    email: "bashekim@hastane.test",
    sifre: "Test1234!",
    ad: "Test",
    soyad: "Başhekim",
    rol: "BASHEKIM",
  },
  {
    id: "3",
    email: "doktor@hastane.test",
    sifre: "Test1234!",
    ad: "Ufuk",
    soyad: "Öztürk",
    rol: "DOKTOR",
  },
  {
    id: "4",
    email: "hemsire@hastane.test",
    sifre: "Test1234!",
    ad: "Test",
    soyad: "Hemşire",
    rol: "HEMSIRE",
  },
  {
    id: "5",
    email: "laborant@hastane.test",
    sifre: "Test1234!",
    ad: "Test",
    soyad: "Laborant",
    rol: "LABORANT",
  },
  {
    id: "6",
    email: "temizlik@hastane.test",
    sifre: "Test1234!",
    ad: "Test",
    soyad: "Temizlik",
    rol: "TEMIZLIK_PERSONELI",
  },
  {
    id: "7",
    email: "mudur@hastane.test",
    sifre: "Test1234!",
    ad: "Test",
    soyad: "Müdür",
    rol: "MUDUR",
  },
  {
    id: "8",
    email: "ebe@hastane.test",
    sifre: "Test1234!",
    ad: "Test",
    soyad: "Ebe",
    rol: "EBE",
  },
  {
    id: "9",
    email: "guvenlik@hastane.test",
    sifre: "Test1234!",
    ad: "Test",
    soyad: "Güvenlik",
    rol: "GUVENLIK",
  },
  {
    id: "10",
    email: "idari@hastane.test",
    sifre: "Test1234!",
    ad: "Test",
    soyad: "İdari",
    rol: "IDARI_PERSONEL",
  },
  {
    id: "11",
    email: "hasta@hastane.test",
    sifre: "Test1234!",
    ad: "Test",
    soyad: "Hasta",
    rol: "HASTA",
  },
];
