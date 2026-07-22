import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";
import { Button, Input } from "@/shared/ui";

type Ziyaretci = {
  id: number;
  ad_soyad: string;
  tc_kimlik: string | null;
  ziyaret_edilen: string;
  servis: string | null;
  giris_zamani: string;
  cikis_zamani: string | null;
  notlar: string | null;
};

export function GuvenlikZiyaretcilerPage() {
  const qc = useQueryClient();
  const [adSoyad, setAdSoyad] = useState("");
  const [tc, setTc] = useState("");
  const [ziyaretEdilen, setZiyaretEdilen] = useState("");
  const [servis, setServis] = useState("");
  const [notlar, setNotlar] = useState("");
  const [sadeceAcik, setSadeceAcik] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const { data: liste = [], isLoading } = useQuery({
    queryKey: ["guvenlik-ziyaretciler", sadeceAcik],
    queryFn: async () =>
      (
        await api.get<Ziyaretci[]>("/guvenlik/ziyaretciler", {
          params: { sadece_acik: sadeceAcik },
        })
      ).data,
  });

  const createMut = useMutation({
    mutationFn: async () =>
      api.post("/guvenlik/ziyaretciler", {
        ad_soyad: adSoyad,
        tc_kimlik: tc || null,
        ziyaret_edilen: ziyaretEdilen,
        servis: servis || null,
        notlar: notlar || null,
      }),
    onSuccess: () => {
      setAdSoyad("");
      setTc("");
      setZiyaretEdilen("");
      setServis("");
      setNotlar("");
      setErr(null);
      qc.invalidateQueries({ queryKey: ["guvenlik-ziyaretciler"] });
      qc.invalidateQueries({ queryKey: ["guvenlik-ozet"] });
    },
    onError: (e) => setErr(getApiErrorMessage(e)),
  });

  const cikisMut = useMutation({
    mutationFn: async (id: number) =>
      api.post(`/guvenlik/ziyaretciler/${id}/cikis`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["guvenlik-ziyaretciler"] });
      qc.invalidateQueries({ queryKey: ["guvenlik-ozet"] });
    },
    onError: (e) => setErr(getApiErrorMessage(e)),
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Ziyaretçi Kayıt</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Giriş-çıkış defteri
        </p>
      </div>

      <form
        className="flex flex-wrap items-end gap-2 rounded-xl border bg-card p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!adSoyad.trim() || !ziyaretEdilen.trim()) return;
          createMut.mutate();
        }}
      >
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Ad soyad</span>
          <Input value={adSoyad} onChange={(e) => setAdSoyad(e.target.value)} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">TC (opsiyonel)</span>
          <Input
            value={tc}
            maxLength={11}
            onChange={(e) => setTc(e.target.value)}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Ziyaret edilen</span>
          <Input
            value={ziyaretEdilen}
            onChange={(e) => setZiyaretEdilen(e.target.value)}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Servis</span>
          <Input value={servis} onChange={(e) => setServis(e.target.value)} />
        </label>
        <label className="min-w-[180px] flex-1 space-y-1 text-sm">
          <span className="text-muted-foreground">Not</span>
          <Input value={notlar} onChange={(e) => setNotlar(e.target.value)} />
        </label>
        <Button type="submit" disabled={createMut.isPending}>
          Giriş kaydet
        </Button>
      </form>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={sadeceAcik}
          onChange={(e) => setSadeceAcik(e.target.checked)}
        />
        Yalnızca çıkış yapılmamış ziyaretçiler
      </label>

      {err && <p className="text-sm text-destructive">{err}</p>}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Yükleniyor…</p>
      ) : (
        <ul className="space-y-2">
          {liste.map((z) => (
            <li
              key={z.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded border bg-card p-3 text-sm"
            >
              <div>
                <div className="font-medium">
                  {z.ad_soyad}
                  {z.tc_kimlik ? ` · ${z.tc_kimlik}` : ""}
                </div>
                <div className="text-muted-foreground">
                  {z.ziyaret_edilen}
                  {z.servis ? ` · ${z.servis}` : ""}
                </div>
                <div className="text-xs text-muted-foreground">
                  Giriş: {new Date(z.giris_zamani).toLocaleString("tr-TR")}
                  {z.cikis_zamani
                    ? ` · Çıkış: ${new Date(z.cikis_zamani).toLocaleString("tr-TR")}`
                    : " · İçeride"}
                </div>
              </div>
              {!z.cikis_zamani && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => cikisMut.mutate(z.id)}
                >
                  Çıkış
                </Button>
              )}
            </li>
          ))}
          {!liste.length && (
            <p className="text-muted-foreground">Ziyaretçi kaydı yok.</p>
          )}
        </ul>
      )}
    </div>
  );
}
