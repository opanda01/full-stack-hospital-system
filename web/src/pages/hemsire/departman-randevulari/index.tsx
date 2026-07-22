import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";

type Randevu = {
  id: number;
  hasta_id: number;
  tarih_saat: string;
  durum: string;
  departman_id: number;
};

export function HemsireDepartmanRandevulariPage() {
  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ["hemsire-randevular"],
    queryFn: async () => (await api.get<Randevu[]>("/randevular/")).data,
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Departman Randevuları</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Departmanınızdaki randevu kayıtları
        </p>
      </div>
      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>
      ) : (
        <ul className="space-y-2">
          {data.map((r) => (
            <li key={r.id} className="rounded border bg-card px-3 py-2 text-sm">
              #{r.id} — {new Date(r.tarih_saat).toLocaleString("tr-TR")} — {r.durum} —
              Hasta #{r.hasta_id}
            </li>
          ))}
          {!data.length && (
            <li className="text-muted-foreground text-sm">Randevu yok.</li>
          )}
        </ul>
      )}
    </div>
  );
}
