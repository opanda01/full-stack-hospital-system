import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/shared/ui";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";

type Doktor = {
  id: number;
  uzmanlik_alani: string;
  diploma_no: string;
  online_randevu_acik_mi: boolean;
};

export function DoktorProfilPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["doktor-ben"],
    queryFn: async () => (await api.get<Doktor>("/doktorlar/ben")).data,
  });
  const [uzmanlik, setUzmanlik] = useState("");
  const [online, setOnline] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setUzmanlik(data.uzmanlik_alani);
    setOnline(data.online_randevu_acik_mi);
  }, [data]);

  const save = useMutation({
    mutationFn: async () =>
      api.patch(`/doktorlar/${data!.id}`, {
        uzmanlik_alani: uzmanlik,
        online_randevu_acik_mi: online,
      }),
    onSuccess: () => {
      setMsg("Kaydedildi");
      qc.invalidateQueries({ queryKey: ["doktor-ben"] });
    },
  });

  if (isLoading) return <p>Yükleniyor…</p>;
  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Profilim</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Diploma ve uzmanlık bilgileriniz
        </p>
      </div>
      <div className="max-w-md space-y-3 rounded-xl border border-border bg-card p-4">
        {msg && <p className="text-sm text-emerald-700">{msg}</p>}
        <p className="text-sm">Diploma: {data.diploma_no}</p>
        <label className="block text-sm">
          Uzmanlık
          <input
            className="mt-1 w-full rounded-md border border-border px-3 py-2"
            value={uzmanlik}
            onChange={(e) => setUzmanlik(e.target.value)}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={online}
            onChange={(e) => setOnline(e.target.checked)}
          />
          Online randevu açık
        </label>
        <Button type="button" onClick={() => save.mutate()} disabled={save.isPending}>
          Kaydet
        </Button>
      </div>
    </div>
  );
}
