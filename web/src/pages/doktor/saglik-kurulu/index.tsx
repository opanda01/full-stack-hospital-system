import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";

type Kurul = {
  id: number;
  baslik: string;
  hasta_id: number | null;
  karar_ozeti: string | null;
  durum: string;
  uye_doktor_idler: number[];
};

export function DoktorSaglikKuruluPage() {
  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ["saglik-kurulu"],
    queryFn: async () => (await api.get<Kurul[]>("/saglik-kurulu/")).data,
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Sağlık kurulu</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Üye olduğunuz kurul kayıtları
        </p>
      </div>
      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>
      ) : data.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Üye olduğunuz kurul kaydı yok.
        </p>
      ) : (
        <ul className="space-y-3">
          {data.map((k) => (
            <li key={k.id} className="rounded-xl border border-border p-4">
              <div className="font-medium">
                {k.baslik} · {k.durum}
              </div>
              {k.karar_ozeti && (
                <p className="mt-1 text-sm text-muted-foreground">{k.karar_ozeti}</p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                Üye sayısı: {k.uye_doktor_idler.length}
                {k.hasta_id != null ? ` · Hasta #${k.hasta_id}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
