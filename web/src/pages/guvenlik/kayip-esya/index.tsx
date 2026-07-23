import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";
import { Button, Input } from "@/shared/ui";

type KayipEsya = {
  id: number;
  tanim: string;
  bulunan_yer: string;
  bulunan_tarih: string;
  durum: string;
  teslim_alan: string | null;
  notlar: string | null;
};

const DURUMLAR = ["BEKLIYOR", "TESLIM", "POLISE"] as const;

export function GuvenlikKayipEsyaPage() {
  const qc = useQueryClient();
  const [tanim, setTanim] = useState("");
  const [yer, setYer] = useState("");
  const [notlar, setNotlar] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const { data: liste = [], isLoading } = useQuery({
    queryKey: ["guvenlik-kayip-esyalar"],
    queryFn: async () =>
      (await api.get<KayipEsya[]>("/guvenlik/kayip-esyalar")).data,
  });

  const createMut = useMutation({
    mutationFn: async () =>
      api.post("/guvenlik/kayip-esyalar", {
        tanim,
        bulunan_yer: yer,
        notlar: notlar || null,
      }),
    onSuccess: () => {
      setTanim("");
      setYer("");
      setNotlar("");
      setErr(null);
      qc.invalidateQueries({ queryKey: ["guvenlik-kayip-esyalar"] });
      qc.invalidateQueries({ queryKey: ["guvenlik-ozet"] });
    },
    onError: (e) => setErr(getApiErrorMessage(e)),
  });

  const updateMut = useMutation({
    mutationFn: async ({
      id,
      durum,
      teslim_alan,
    }: {
      id: number;
      durum: string;
      teslim_alan?: string;
    }) =>
      api.patch(`/guvenlik/kayip-esyalar/${id}`, {
        durum,
        teslim_alan: teslim_alan || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["guvenlik-kayip-esyalar"] });
      qc.invalidateQueries({ queryKey: ["guvenlik-ozet"] });
    },
    onError: (e) => setErr(getApiErrorMessage(e)),
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Kayıp Eşya</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Buluntu kayıtları ve teslim durumu
        </p>
      </div>

      <form
        className="flex flex-wrap items-end gap-2 rounded-xl border bg-card p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!tanim.trim() || !yer.trim()) return;
          createMut.mutate();
        }}
      >
        <label className="min-w-[200px] flex-1 space-y-1 text-sm">
          <span className="text-muted-foreground">Tanım</span>
          <Input value={tanim} onChange={(e) => setTanim(e.target.value)} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Bulunan yer</span>
          <Input value={yer} onChange={(e) => setYer(e.target.value)} />
        </label>
        <label className="min-w-[160px] flex-1 space-y-1 text-sm">
          <span className="text-muted-foreground">Not</span>
          <Input value={notlar} onChange={(e) => setNotlar(e.target.value)} />
        </label>
        <Button type="submit" disabled={createMut.isPending}>
          Kaydet
        </Button>
      </form>

      {err && <p className="text-sm text-destructive">{err}</p>}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Yükleniyor…</p>
      ) : (
        <ul className="space-y-2">
          {liste.map((e) => (
            <li
              key={e.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded border bg-card p-3 text-sm"
            >
              <div>
                <div className="font-medium">
                  {e.tanim} · {e.durum}
                </div>
                <div className="text-muted-foreground">{e.bulunan_yer}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(e.bulunan_tarih).toLocaleString("tr-TR")}
                  {e.teslim_alan ? ` · Teslim: ${e.teslim_alan}` : ""}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  className="h-9 rounded-md border bg-background px-2 text-sm"
                  value={e.durum}
                  onChange={(ev) => {
                    const durum = ev.target.value;
                    const teslim_alan =
                      durum === "TESLIM"
                        ? window.prompt("Teslim alan adı") || undefined
                        : undefined;
                    updateMut.mutate({ id: e.id, durum, teslim_alan });
                  }}
                >
                  {DURUMLAR.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </li>
          ))}
          {!liste.length && (
            <p className="text-muted-foreground">Kayıp eşya kaydı yok.</p>
          )}
        </ul>
      )}
    </div>
  );
}
