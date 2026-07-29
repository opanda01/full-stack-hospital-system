import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Button, Input } from "@/shared/ui";
import { api } from "@/shared/api";
import { getApiErrorMessage, unwrapPage, type PageResponse, LOOKUP_PAGE_SIZE } from "@/shared/lib";
import {
  DoktorHastaSecimField,
  useDoktorHastaListeFiltresi,
} from "@/features/doktor-hasta-secim";

type Tetkik = {
  id: string;
  hasta_id: string;
  tetkik_turu: string;
  sonuc_dosyasi: string | null;
  durum: string;
};
type Doktor = { id: number };

export function DoktorTetkiklerimPage() {
  const qc = useQueryClient();
  const [durumFiltre, setDurumFiltre] = useState("");
  const hastaFiltre = useDoktorHastaListeFiltresi();
  const [tur, setTur] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const { data: tetkikler = [], isLoading, isError, error } = useQuery({
    queryKey: ["tetkikler"],
    queryFn: async () =>
      unwrapPage(
        (
          await api.get<PageResponse<Tetkik>>("/tetkikler/", {
            params: { page_size: LOOKUP_PAGE_SIZE },
          })
        ).data,
      ),
  });
  const { data: doktor } = useQuery({
    queryKey: ["doktor-ben"],
    queryFn: async () => (await api.get<Doktor>("/doktorlar/ben")).data,
  });

  const filtered = useMemo(() => {
    return tetkikler.filter(
      (t) =>
        (!durumFiltre || t.durum === durumFiltre) &&
        hastaFiltre.matchHastaId(t.hasta_id),
    );
  }, [tetkikler, durumFiltre, hastaFiltre.matchHastaId]);

  const createMut = useMutation({
    mutationFn: async () =>
      api.post("/tetkikler/", {
        hasta_id: hastaFiltre.hastaId,
        istek_yapan_doktor_id: doktor!.id,
        tetkik_turu: tur,
      }),
    onSuccess: () => {
      setErr(null);
      setTur("");
      qc.invalidateQueries({ queryKey: ["tetkikler"] });
    },
    onError: (e) => setErr(getApiErrorMessage(e)),
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Tetkiklerim</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Laboratuvar / radyoloji istekleri ve sonuçları
        </p>
      </div>

      <div className="max-w-xl space-y-3 rounded-xl border border-border bg-card p-4">
        <DoktorHastaSecimField
          mode="filtre"
          hastaModu={hastaFiltre.hastaModu}
          onModuChange={hastaFiltre.switchModu}
          hastaTarih={hastaFiltre.hastaTarih}
          onTarihChange={hastaFiltre.changeTarih}
          options={hastaFiltre.hastaSecenekleri}
          value={hastaFiltre.hastaId}
          onChange={hastaFiltre.setHastaId}
        />

        <div className="border-t border-border pt-3 space-y-3">
          <h3 className="text-sm font-semibold">Yeni tetkik isteği</h3>
          {err && (
            <p className="text-sm text-red-600" role="alert">
              {err}
            </p>
          )}
          <Input
            placeholder="Tetkik türü"
            value={tur}
            onChange={(e) => setTur(e.target.value)}
          />
          <Button
            type="button"
            disabled={
              !hastaFiltre.hastaId || !tur || !doktor || createMut.isPending
            }
            onClick={() => createMut.mutate()}
          >
            İstek oluştur
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant={durumFiltre === "" ? "default" : "outline"}
          onClick={() => setDurumFiltre("")}
        >
          Tümü
        </Button>
        <Button
          size="sm"
          variant={durumFiltre === "BEKLEMEDE" ? "default" : "outline"}
          onClick={() => setDurumFiltre("BEKLEMEDE")}
        >
          Bekleyen
        </Button>
        <Button
          size="sm"
          variant={durumFiltre === "SONUCLANDI" ? "default" : "outline"}
          onClick={() => setDurumFiltre("SONUCLANDI")}
        >
          Sonuçlandı
        </Button>
      </div>

      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Tetkik yok.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Hasta</th>
              <th>Tür</th>
              <th>Durum</th>
              <th>Sonuç</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="border-b">
                <td className="py-2">
                  {hastaFiltre.hastaLabel.get(t.hasta_id) ?? `#${t.hasta_id}`}
                </td>
                <td>{t.tetkik_turu}</td>
                <td>{t.durum}</td>
                <td>{t.sonuc_dosyasi ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/** Eski rota uyumluluğu */
export { DoktorTetkiklerimPage as DoktorTetkikIstePage };
