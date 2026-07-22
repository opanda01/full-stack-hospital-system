import { z } from "zod";

export const istekSchema = z.object({
  kimlik: z
    .string()
    .min(2, "Sicil no, kullanıcı adı veya e-posta girin"),
});

export type IstekFormValues = z.infer<typeof istekSchema>;

export const onaySchema = z
  .object({
    kod: z
      .string()
      .length(6, "Doğrulama kodu 6 haneli olmalı")
      .regex(/^\d{6}$/, "Doğrulama kodu yalnızca rakam olmalı"),
    yeni_sifre: z.string().min(8, "Yeni şifre en az 8 karakter olmalı"),
    yeni_sifre_tekrar: z.string().min(8, "Şifre tekrarı gerekli"),
  })
  .refine((d) => d.yeni_sifre === d.yeni_sifre_tekrar, {
    message: "Şifreler eşleşmiyor",
    path: ["yeni_sifre_tekrar"],
  });

export type OnayFormValues = z.infer<typeof onaySchema>;
