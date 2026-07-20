import { z } from "zod";

export const girisSchema = z.object({
  email: z.string().email("Geçerli e-posta girin"),
  sifre: z.string().min(1, "Şifre gerekli"),
});

export type GirisFormValues = z.infer<typeof girisSchema>;

export const DEV_CREDENTIALS = {
  email: "admin@hastane.example.com",
  sifre: "Test1234!",
} as const;
