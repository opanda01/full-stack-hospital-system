import { api } from "@/shared/api";
import type { RandevuOlusturValues } from "../model/schema";

export async function createRandevu(_data: RandevuOlusturValues) {
  // TODO: POST /randevular
  return api.post("/randevular", _data);
}
