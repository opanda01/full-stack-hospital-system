export type SikayetOzet = {
  toplam: number;
  bekleyen: number;
  cozulen: number;
};

export type SikayetDurum = "ACIK" | "INCELENIYOR" | "COZULDU" | "REDDEDILDI";

export const SIKAYET_DURUM_OPTIONS: { value: SikayetDurum; label: string }[] = [
  { value: "ACIK", label: "Açık" },
  { value: "INCELENIYOR", label: "İnceleniyor" },
  { value: "COZULDU", label: "Çözüldü" },
  { value: "REDDEDILDI", label: "Reddedildi" },
];

export function sikayetDurumBadgeVariant(
  durum: string,
): "acil" | "beklemede" | "tamamlandi" | "iptal" {
  switch (durum) {
    case "ACIK":
      return "acil";
    case "INCELENIYOR":
      return "beklemede";
    case "COZULDU":
      return "tamamlandi";
    case "REDDEDILDI":
      return "iptal";
    default:
      return "iptal";
  }
}

export function sikayetDurumLabel(durum: string): string {
  return SIKAYET_DURUM_OPTIONS.find((o) => o.value === durum)?.label ?? durum;
}
