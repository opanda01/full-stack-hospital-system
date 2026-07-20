import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell, Button } from "@/shared/ui";
import { api } from "@/shared/api";

type Tetkik = {
  id: number;
  tetkik_turu: string;
  durum: string;
  sonuc_dosyasi: string | null;
};

export function LaborantPage() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["tetkikler"],
    queryFn: async () => (await api.get<Tetkik[]>("/tetkikler/")).data,
  });
  const [sonuc, setSonuc] = useState<Record<number, string>>({});
  const kaydet = useMutation({
    mutationFn: ({ id, text }: { id: number; text: string }) =>
      api.patch(`/tetkikler/${id}/sonuc`, {
        sonuc_dosyasi: text,
        durum: "SONUCLANDI",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tetkikler"] }),
  });

  return (
    <AppShell title="Laborant — Tetkik Sonuçları">
      <ul className="space-y-3">
        {data.map((t) => (
          <li key={t.id} className="rounded border bg-white p-3 text-sm">
            <p>
              #{t.id} {t.tetkik_turu} — {t.durum}
            </p>
            {t.durum !== "SONUCLANDI" && (
              <div className="mt-2 flex gap-2">
                <input
                  className="flex-1 rounded border px-2 py-1"
                  placeholder="Sonuç / dosya yolu"
                  value={sonuc[t.id] ?? ""}
                  onChange={(e) =>
                    setSonuc((s) => ({ ...s, [t.id]: e.target.value }))
                  }
                />
                <Button
                  type="button"
                  onClick={() =>
                    kaydet.mutate({ id: t.id, text: sonuc[t.id] || "sonuc.pdf" })
                  }
                >
                  Kaydet
                </Button>
              </div>
            )}
            {t.sonuc_dosyasi && (
              <p className="mt-1 text-slate-500">Sonuç: {t.sonuc_dosyasi}</p>
            )}
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
