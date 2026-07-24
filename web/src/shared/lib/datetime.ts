/** Klinik randevu saatleri — her zaman Europe/Istanbul. */

const IST = "Europe/Istanbul";

export function formatIstanbulDateTime(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleString("tr-TR", { timeZone: IST });
}

export function formatIstanbulTime(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleTimeString("tr-TR", {
    timeZone: IST,
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatIstanbulDate(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString("tr-TR", { timeZone: IST });
}
