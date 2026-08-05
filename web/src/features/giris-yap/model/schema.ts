import { z } from "zod";

export const girisSchema = z.object({
  kimlik: z
    .string()
    .min(2, "Sicil no, kullanıcı adı veya e-posta girin"),
  sifre: z.string().min(6, "Şifre en az 6 karakter olmalı"),
});

export type GirisFormValues = z.infer<typeof girisSchema>;

export const DEV_CREDENTIALS = {
  kimlik: "admin",
  sifre: "Test1234!",
  sicil: "ADM-001",
  email: "admin@hastane.example.com",
} as const;

export const DEV_BASHEKIM_CREDENTIALS = {
  kimlik: "bashekim",
  sifre: "Test1234!",
  sicil: "BH-001",
  email: "bashekim@hastane.example.com",
  label: "Başhekim",
} as const;

export const DEV_DOKTOR_CREDENTIALS = {
  kimlik: "doktor",
  sifre: "Test1234!",
  sicil: "D-001",
  email: "doktor@hastane.example.com",
  label: "Doktor",
} as const;

export const DEV_HEMSIRE_CREDENTIALS = {
  kimlik: "hemsire",
  sifre: "Test1234!",
  sicil: "H-001",
  email: "hemsire@hastane.example.com",
  label: "Hemşire",
} as const;

export const DEV_EBE_CREDENTIALS = {
  kimlik: "ebe",
  sifre: "Test1234!",
  sicil: "E-001",
  email: "ebe@hastane.example.com",
  label: "Ebe",
} as const;

export const DEV_GUVENLIK_CREDENTIALS = {
  kimlik: "guvenlik",
  sifre: "Test1234!",
  sicil: "G-001",
  email: "guvenlik@hastane.example.com",
  label: "Güvenlik",
} as const;
