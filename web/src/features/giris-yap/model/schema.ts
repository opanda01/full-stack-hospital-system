import { z } from "zod";

export const girisSchema = z.object({
  kimlik: z
    .string()
    .min(2, "Sicil no, kullanıcı adı veya e-posta girin"),
  sifre: z.string().min(6, "Şifre en az 6 karakter olmalı"),
});

export type GirisFormValues = z.infer<typeof girisSchema>;

export const DEV_CREDENTIALS = {
  kimlik: "ADM-001",
  sifre: "Test1234!",
} as const;

export const DEV_BASHEKIM_CREDENTIALS = {
  kimlik: "BH-001",
  sifre: "Test1234!",
  label: "Başhekim",
} as const;

export const DEV_DOKTOR_CREDENTIALS = {
  kimlik: "D-001",
  sifre: "Test1234!",
  label: "Doktor",
} as const;
