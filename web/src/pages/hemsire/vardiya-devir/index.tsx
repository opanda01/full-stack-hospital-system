import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";
import { Button, Input } from "@/shared/ui";

type Devir = {
  id: number;
  yazar_id: number;
  metin: string;
  yatis_id: number | null;
  vardiya_tarihi: string;
  created_at: string;
};
type Yatis = { id: number; protokol_no: string; hasta_ad_soyad: string };

export function HemsireVardiyaDevirPage() {
  const qc = useQueryClient();
  const [metin, setMetin] = useState("");
  const [yatisId, setYatisId] = useState("");
  const [tarih, setTarih] = useState(new Date().toISOString().slice(0, 10));
  const [err, setErr] = useState<string | null>(null);

  const { data: notlar = [], isLoading } = useQuery({
    queryKey: ["vardiya-devir", tarih],
    queryFn: async () =>
      (
        await api.get<Devir[]>("/yatis/vardiya-devir", {
          params: { vardiya_tarihi: tarih },
        })
      ).data,
  });

  const { data: yatislar = [] } = useQuery({
    queryKey: ["yatis-kayitlar-aktif"],
    queryFn: async () =>
      (await api.get<Yatis[]>("/yatis/kayitlar", { params: { aktif: true } })).data,
  });

  const createMut = useMutation({
    mutationFn: async () =>
      api.post("/yatis/vardiya-devir", {
        metin,
        yatis_id: yatisId ? Number(yatisId) : null,
        vardiya_tarihi: tarih,
      }),
    onSuccess: () => {
      setMetin("");
      setYatisId("");
      setErr(null);
      qc.invalidateQueries({ queryKey: ["vardiya-devir"] });
    },
    onError: (e) => setErr(getApiErrorMessage(e)),
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Vardiya Devir Notu</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sonraki hemşireye bırakılan notlar
        </p>
      </div>

      <div className="flex flex-wrap gap-2 items-end">
        <label className="text-sm space-y-1">
          <span className="text-muted-foreground">Vardiya tarihi</span>
          <Input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} />
        </label>
      </div>

      <div className="rounded-xl border bg-card p-4 space-y-3">
        <textarea
          className="min-h-[100px] w-full rounded-md border bg-background px-3 py-2 text-sm"
          placeholder="Devir notu… (örn: yatak 12 - gece ateşi yükseldi)"
          value={metin}
          onChange={(e) => setMetin(e.target.value)}
        />
        <select
          className="h-9 rounded-md border bg-background px-2 text-sm"
          value={yatisId}
          onChange={(e) => setYatisId(e.target.value)}
        >
          <option value="">Hasta bağlama (opsiyonel)</option>
          {yatislar.map((y) => (
            <option key={y.id} value={y.id}>
              {y.hasta_ad_soyad} — {y.protokol_no}
            </option>
          ))}
        </select>
        <Button
          disabled={!metin.trim() || createMut.isPending}
          onClick={() => createMut.mutate()}
        >
          Kaydet
        </Button>
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}

      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : (
        <ul className="space-y-2">
          {notlar.map((n) => (
            <li key={n.id} className="rounded border px-3 py-2 text-sm">
              <p className="text-xs text-muted-foreground">
                {new Date(n.created_at).toLocaleString("tr-TR")}
                {n.yatis_id ? ` · Yatış #${n.yatis_id}` : ""}
              </p>
              <p className="mt-1 whitespace-pre-wrap">{n.metin}</p>
            </li>
          ))}
          {!notlar.length && (
            <li className="text-muted-foreground text-sm">Bu tarih için not yok</li>
          )}
        </ul>
      )}
    </div>
  );
}
