import type { VariantProps } from "class-variance-authority";
import type { badgeVariants } from "@/shared/ui/badge";

export type StatusBadgeVariant = NonNullable<
  VariantProps<typeof badgeVariants>["variant"]
>;

const DURUM_PATTERNS: { test: RegExp; variant: StatusBadgeVariant }[] = [
  { test: /kritik|KRITIK/i, variant: "kritik" },
  { test: /acil|ACIL/i, variant: "acil" },
  { test: /iptal|pasif|atlandi|ATLANDI|IPTAL|PASIF/i, variant: "iptal" },
  { test: /bekl|BEKLIYOR|BEKLEMEDE|plan/i, variant: "beklemede" },
  {
    test: /tamam|onay|verildi|sonucland|aktif|ONAY|TAMAM|VERILDI|SONUCLANDI|AKTIF/i,
    variant: "tamamlandi",
  },
];

/** API durum metninden kurumsal rozet varyantı üretir. */
export function durumToBadgeVariant(durum: string): StatusBadgeVariant {
  const d = durum.trim();
  for (const { test, variant } of DURUM_PATTERNS) {
    if (test.test(d)) return variant;
  }
  return "secondary";
}
