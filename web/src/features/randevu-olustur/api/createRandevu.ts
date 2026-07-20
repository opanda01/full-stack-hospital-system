import { api } from "@/shared/api";
import type { RandevuOlusturValues } from "../model/schema";

export async function createRandevu(data: RandevuOlusturValues) {
  const { data: res } = await api.post("/randevular/", {
    hasta_id: data.hastaId,
    doktor_id: data.doktorId,
    departman_id: data.departmanId,
    tarih_saat: data.tarihSaat,
    notlar: data.notlar ?? null,
  });
  return res;
}
