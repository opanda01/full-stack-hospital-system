import type { Rol } from "@/shared/config/nav-items";
import { ROL_ETIKET } from "@/shared/config/nav-items";
import type { NobetPersonel } from "../model/types";

export function personelGorevEtiketi(p: NobetPersonel): string {
  if (p.rol && p.rol in ROL_ETIKET) {
    return ROL_ETIKET[p.rol as Rol];
  }
  if (p.unvan?.trim()) return p.unvan.trim();
  return "Personel";
}

export function personelTamEtiket(p: NobetPersonel): string {
  const ad =
    `${p.ad ?? ""} ${p.soyad ?? ""}`.trim() || p.sicil_no || `#${p.id}`;
  return `${ad} · ${personelGorevEtiketi(p)}`;
}
