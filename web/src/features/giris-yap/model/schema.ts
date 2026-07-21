import { z } from "zod";

export const girisSchema = z.object({
  email: z.string().email("Geçerli e-posta girin"),
  sifre: z.string().min(6, "Şifre en az 6 karakter olmalı"),
});

export type GirisFormValues = z.infer<typeof girisSchema>;

export const DEV_CREDENTIALS = {
  email: "admin@hastane.test",
  sifre: "Test1234!",
} as const;
