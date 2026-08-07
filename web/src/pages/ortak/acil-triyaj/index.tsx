import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { AppShell, Button } from "@/shared/ui";
import { api } from "@/shared/api";
import {
  fetchAllPages,
  formatIstanbulDateTime,
  getApiErrorMessage,
} from "@/shared/lib";
import { roleRootFromPath } from "@/shared/lib/role-root";
import type { Hasta } from "@/entities/hasta";

const RENKLER = ["KIRMIZI", "TURUNCU", "SARI", "YESIL", "MAVI", "BEYAZ"] as const;

type TriyajRow = {
  id: number;
  hasta_id: number;
  randevu_id: number | null;
  sikayet_ozet: string;
  ats_skor: number | null;
  renk: string;
  notlar: string | null;
  created_at: string;
};

export function AcilTriyajPage() {
  const roleRoot = roleRootFromPath(useLocation().pathname);
  const qc = useQueryClient();

  const { data: hastalar = [] } = useQuery({
    queryKey: ["hastalar"],
    queryFn: () => fetchAllPages<Hasta>("/hastalar/"),
  });

  const { data: triyajlar = [], isLoading } = useQuery({
    queryKey: ["acil-triyaj"],
    queryFn: async () =>
      (await api.get<TriyajRow[]>("/acil/triyaj")).data,
  });

  const [hastaId, setHastaId] = useState("");
  const [sikayet, setSikayet] = useState("");
  const [renk, setRenk] = useState<(typeof RENKLER)[number]>("SARI");
  const [ats, setAts] = useState("");
  const [notlar, setNotlar] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () =>
      api.post("/acil/triyaj", {
        hasta_id: hastaId,
        sikayet_ozet: sikayet,
        renk,
        ats_skor: ats ? Number(ats) : null,
        notlar: notlar || null,
      }),
    onSuccess: () => {
      setMsg("Triyaj kaydedildi");
      setSikayet("");
      setNotlar("");
      void qc.invalidateQueries({ queryKey: ["acil-triyaj"] });
    },
    onError: (e) => setMsg(getApiErrorMessage(e)),
  });

  return (
    <AppShell title="Acil triyaj" links={[{ to: roleRoot, label: "Ana" }]}>
      <p className="mb-4 text-sm text-muted-foreground">
        Acil servis triyaj kaydı (ATS skoru opsiyonel).
      </p>

      <form
        className="mb-8 grid max-w-xl gap-3 rounded-xl border border-border p-4"
        onSubmit={(e) => {
          e.preventDefault();
          setMsg(null);
          if (!hastaId || sikayet.trim().length < 3) {
            setMsg("Hasta ve şikayet özeti (min 3 karakter) gerekli");
            return;
          }
          create.mutate();
        }}
      >
        <label className="text-sm">
          Hasta
          <select
            className="mt-1 block w-full rounded-md border border-border px-3 py-2"
            value={hastaId}
            onChange={(e) => setHastaId(e.target.value)}
            required
          >
            <option value="">Seçin…</option>
            {hastalar.map((h) => (
              <option key={h.id} value={h.id}>
                {h.ad} {h.soyad} — {h.tc_kimlik_no}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Şikayet özeti
          <textarea
            className="mt-1 w-full rounded-md border border-border px-3 py-2"
            rows={3}
            value={sikayet}
            onChange={(e) => setSikayet(e.target.value)}
            required
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <label className="text-sm">
            Renk
            <select
              className="mt-1 block rounded-md border border-border px-3 py-2"
              value={renk}
              onChange={(e) =>
                setRenk(e.target.value as (typeof RENKLER)[number])
              }
            >
              {RENKLER.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            ATS (1–5)
            <input
              type="number"
              min={1}
              max={5}
              className="mt-1 block w-24 rounded-md border border-border px-3 py-2"
              value={ats}
              onChange={(e) => setAts(e.target.value)}
            />
          </label>
        </div>
        <label className="text-sm">
          Notlar
          <input
            className="mt-1 w-full rounded-md border border-border px-3 py-2"
            value={notlar}
            onChange={(e) => setNotlar(e.target.value)}
          />
        </label>
        <Button type="submit" disabled={create.isPending}>
          Kaydet
        </Button>
        {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
      </form>

      <h2 className="mb-2 text-lg font-medium">Son kayıtlar</h2>
      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : triyajlar.length === 0 ? (
        <p className="text-sm text-muted-foreground">Kayıt yok.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">Zaman</th>
                <th>Renk</th>
                <th>ATS</th>
                <th>Şikayet</th>
                <th>Hasta</th>
              </tr>
            </thead>
            <tbody>
              {triyajlar.map((t) => (
                <tr key={t.id} className="border-b">
                  <td className="py-2">
                    {formatIstanbulDateTime(t.created_at)}
                  </td>
                  <td>{t.renk}</td>
                  <td>{t.ats_skor ?? "—"}</td>
                  <td className="max-w-xs truncate">{t.sikayet_ozet}</td>
                  <td>Hasta #{t.hasta_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
