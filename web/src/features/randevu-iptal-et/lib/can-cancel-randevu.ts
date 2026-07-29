/** Gelecekteki, iptal edilmemiş randevular iptal edilebilir. */
export function randevuIptalEdilebilir(
  durum: string,
  tarihSaat: string,
): boolean {
  if (durum === "IPTAL" || durum === "TAMAMLANDI") return false;
  return new Date(tarihSaat).getTime() > Date.now();
}
