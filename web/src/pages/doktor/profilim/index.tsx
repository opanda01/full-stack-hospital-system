import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell, Button } from "@/shared/ui";
import { api } from "@/shared/api";

type Doktor = {
  id: number;
  uzmanlik_alani: string;
  diploma_no: string;
  online_randevu_acik_mi: boolean;
};

export function DoktorProfilPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["doktor-ben"],
    queryFn: async () => (await api.get<Doktor>("/doktorlar/ben")).data,
  });
  const [uzmanlik, setUzmanlik] = useState("");
  const [online, setOnline] = useState(true);

  const save = useMutation({
    mutationFn: async () =>
      api.patch(`/doktorlar/${data!.id}`, {
        uzmanlik_alani: uzmanlik || data!.uzmanlik_alani,
        online_randevu_acik_mi: online,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doktor-ben"] }),
  });

  if (isLoading || !data) {
    return (
      <AppShell title="Doktor Profili">
        <p>Yükleniyor…</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="Doktor Profili" links={[{ to: "/doktor/randevularim", label: "Randevular" }]}>
      <div className="max-w-md space-y-3 rounded border bg-white p-4">
        <p className="text-sm">Diploma: {data.diploma_no}</p>
        <label className="block text-sm">
          Uzmanlık
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            defaultValue={data.uzmanlik_alani}
            onChange={(e) => setUzmanlik(e.target.value)}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            defaultChecked={data.online_randevu_acik_mi}
            onChange={(e) => setOnline(e.target.checked)}
          />
          Online randevu açık
        </label>
        <Button type="button" onClick={() => save.mutate()}>
          Kaydet
        </Button>
      </div>
    </AppShell>
  );
}
