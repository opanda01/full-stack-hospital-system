import { z } from "zod";

export const randevuOlusturSchema = z.object({
  hastaId: z.string().uuid(),
  doktorId: z.number().int().positive(),
  departmanId: z.number().int().positive(),
  tarihSaat: z.string().min(1),
  notlar: z.string().optional(),
});

export type RandevuOlusturValues = z.infer<typeof randevuOlusturSchema>;
