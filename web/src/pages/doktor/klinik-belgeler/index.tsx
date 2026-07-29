import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/shared/ui";
import { api } from "@/shared/api";
import {
  LOOKUP_PAGE_SIZE,
  getApiErrorMessage,
  unwrapPage,
  type PageResponse,
} from "@/shared/lib";
import {
  DoktorHastaSecimField,
  useDoktorHastaSecim,
} from "@/features/doktor-hasta-secim";

type Tur = "RECETE" | "SEVK" | "TIBBI_RAPOR";

type Kayit = {
  id: number;
  tur: string;
  hasta_id: string | null;
  icerik: string;
  onay_durumu: string;
};

const TITLES: Record<Tur, string> = {
  RECETE: "Reçeteler",
  SEVK: "Sevkler",
  TIBBI_RAPOR: "Tıbbi raporlar",
};

const PLACEHOLDERS: Record<Tur, string> = {
  RECETE: "İlaçlar, doz, kullanım…",
  SEVK: "Sevk edilen birim / gerekçe…",
  TIBBI_RAPOR: "Rapor metni…",
};

const HASTA_ZORUNLU: Tur[] = ["RECETE", "SEVK"];

export function DoktorKlinikBelgePage({ tur }: { tur: Tur }) {
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const hastaSecim = useDoktorHastaSecim(params.get("hasta") ?? "");
  const { hastaId, setHastaId, hastaLabel } = hastaSecim;
  const [icerik, setIcerik] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const { data: kayitlar = [], isLoading, isError, error } = useQuery({
    queryKey: ["klinik-onay", tur],
    queryFn: async () =>
      unwrapPage(
        (
          await api.get<PageResponse<Kayit>>("/klinik-onay/", {
            params: { tur, page_size: LOOKUP_PAGE_SIZE },
          })
        ).data,
      ),
  });

  const createMut = useMutation({
    mutationFn: async () =>
      api.post("/klinik-onay/", {
        tur,
        hasta_id: hastaId || null,
        icerik,
      }),
    onSuccess: () => {
      setErr(null);
      setIcerik("");
      hastaSecim.setHastaId("");
      qc.invalidateQueries({ queryKey: ["klinik-onay"] });
    },
    onError: (e) => setErr(getApiErrorMessage(e)),
  });

  const hastaZorunlu = HASTA_ZORUNLU.includes(tur);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{TITLES[tur]}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Oluşturduğunuz kayıtlar başhekim onay kuyruğuna düşer
        </p>
      </div>

      <div className="max-w-xl space-y-3 rounded-xl border border-border bg-card p-4">
        {err && (
          <p className="text-sm text-red-600" role="alert">
            {err}
          </p>
        )}
        <DoktorHastaSecimField
          hastaModu={hastaSecim.hastaModu}
          onModuChange={hastaSecim.switchModu}
          hastaTarih={hastaSecim.hastaTarih}
          onTarihChange={hastaSecim.changeTarih}
          options={hastaSecim.hastaSecenekleri}
          value={hastaId}
          onChange={setHastaId}
        />
        <textarea
          className="min-h-[100px] w-full rounded-md border border-border px-3 py-2"
          placeholder={PLACEHOLDERS[tur]}
          value={icerik}
          onChange={(e) => setIcerik(e.target.value)}
        />
        <Button
          type="button"
          disabled={
            !icerik.trim() ||
            (hastaZorunlu && !hastaId) ||
            createMut.isPending
          }
          onClick={() => createMut.mutate()}
        >
          Gönder
        </Button>
      </div>

      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>
      ) : kayitlar.length === 0 ? (
        <p className="text-sm text-muted-foreground">Kayıt yok.</p>
      ) : (
        <ul className="space-y-2">
          {kayitlar.map((k) => (
            <li key={k.id} className="rounded-lg border border-border p-3 text-sm">
              <div className="font-medium">
                {k.onay_durumu}
                {k.hasta_id
                  ? ` · ${hastaLabel.get(k.hasta_id) ?? `#${k.hasta_id}`}`
                  : ""}
              </div>
              <p className="mt-1 text-muted-foreground">{k.icerik}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function DoktorRecetelerPage() {
  return <DoktorKlinikBelgePage tur="RECETE" />;
}
export function DoktorSevlerPage() {
  return <DoktorKlinikBelgePage tur="SEVK" />;
}
export function DoktorTibbiRaporlarPage() {
  return <DoktorKlinikBelgePage tur="TIBBI_RAPOR" />;
}
