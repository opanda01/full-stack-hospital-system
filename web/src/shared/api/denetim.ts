import { api } from "@/shared/api";

export type DisAktarimFormat = "PDF" | "CSV" | "XLSX" | "PRINT";

export async function kayitDisAktarimDenetim(input: {
  kaynak: string;
  kaynak_id: string;
  format: DisAktarimFormat;
}): Promise<void> {
  await api.post("/denetim/dis-aktarim", input);
}

export function yazdirVeDenetimle(kaynak: string, kaynakId: string): void {
  void kayitDisAktarimDenetim({
    kaynak,
    kaynak_id: kaynakId,
    format: "PRINT",
  }).finally(() => {
    window.print();
  });
}
