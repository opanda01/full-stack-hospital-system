import { api } from "@/shared/api";

export type PersonelImportBaslat = {
  isi_id: number;
  celery_task_id: string | null;
  toplam: number;
};

export type PersonelImportDurum = {
  id: number;
  actor_id: number;
  durum: "BEKLEMEDE" | "ISLENIYOR" | "TAMAMLANDI" | "HATA";
  toplam: number;
  basarili: number;
  basarisiz: number;
  hata_detay: Array<{ satir?: number; hata?: string; veri?: unknown }> | null;
  celery_task_id: string | null;
};

export async function startPersonelImport(
  file: File,
): Promise<PersonelImportBaslat> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<PersonelImportBaslat>(
    "/personel/import",
    form,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return data;
}

export async function getPersonelImportDurum(
  isiId: number,
): Promise<PersonelImportDurum> {
  const { data } = await api.get<PersonelImportDurum>(
    `/personel/import/${isiId}`,
  );
  return data;
}
