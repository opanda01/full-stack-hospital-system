import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";
import { Button, Input } from "@/shared/ui";

type Devriye = {
  id: number;
  bolge: string;
  baslangic: string;
  bitis: string | null;
  bulgu: string | null;
  personel_id: number;
};

export function GuvenlikDevriyelerPage() {
  const qc = useQueryClient();
  const [bolge, setBolge] = useState("");
  const [bulgu, setBulgu] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const { data: liste = [], isLoading } = useQuery({
    queryKey: ["guvenlik-devriyeler"],
    queryFn: async () => (await api.get<Devriye[]>("/guvenlik/devriyeler")).data,
  });

  const createMut = useMutation({
    mutationFn: async () =>
      api.post("/guvenlik/devriyeler", {
        bolge,
        bulgu: bulgu || null,
      }),
    onSuccess: () => {
      setBolge("");
      setBulgu("");
      setErr(null);
      qc.invalidateQueries({ queryKey: ["guvenlik-devriyeler"] });
    },
    onError: (e) => setErr(getApiErrorMessage(e)),
  });

  const bitirMut = useMutation({
    mutationFn: async (id: number) =>
      api.patch(`/guvenlik/devriyeler/${id}`, {
        bitis: new Date().toISOString(),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["guvenlik-devriyeler"] }),
    onError: (e) => setErr(getApiErrorMessage(e)),
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Devriyeler</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tur / bölge kayıtları
        </p>
      </div>

      <form
        className="flex flex-wrap items-end gap-2 rounded-xl border bg-card p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!bolge.trim()) return;
          createMut.mutate();
        }}
      >
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Bölge</span>
          <Input value={bolge} onChange={(e) => setBolge(e.target.value)} />
        </label>
        <label className="min-w-[220px] flex-1 space-y-1 text-sm">
          <span className="text-muted-foreground">Bulgu (opsiyonel)</span>
          <Input value={bulgu} onChange={(e) => setBulgu(e.target.value)} />
        </label>
        <Button type="submit" disabled={createMut.isPending}>
          Devriye başlat
        </Button>
      </form>

      {err && <p className="text-sm text-destructive">{err}</p>}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Yükleniyor…</p>
      ) : (
        <ul className="space-y-2">
          {liste.map((d) => (
            <li
              key={d.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded border bg-card p-3 text-sm"
            >
              <div>
                <div className="font-medium">{d.bolge}</div>
                <div className="text-xs text-muted-foreground">
                  Başlangıç: {new Date(d.baslangic).toLocaleString("tr-TR")}
                  {d.bitis
                    ? ` · Bitiş: ${new Date(d.bitis).toLocaleString("tr-TR")}`
                    : " · Devam ediyor"}
                </div>
                {d.bulgu && (
                  <div className="text-muted-foreground">{d.bulgu}</div>
                )}
              </div>
              {!d.bitis && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => bitirMut.mutate(d.id)}
                >
                  Bitir
                </Button>
              )}
            </li>
          ))}
          {!liste.length && (
            <p className="text-muted-foreground">Devriye kaydı yok.</p>
          )}
        </ul>
      )}
    </div>
  );
}
