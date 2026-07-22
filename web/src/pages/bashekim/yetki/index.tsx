import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell, Button, Input } from "@/shared/ui";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";
import { roleRootFromPath } from "@/shared/lib/role-root";
import { useLocation } from "react-router-dom";

type Devri = {
  id: number;
  alan_personel_id: number;
  baslangic: string;
  bitis: string;
  duyuru_metni: string;
  aktif_mi: boolean;
};

type Sistem = {
  bildirim_backend: string;
  cors_origins: string;
  login_rate_limit_per_minute: number;
  audit_retention_days: number;
  health: string;
};

export function BashekimYetkiDuyurulariPage() {
  const root = roleRootFromPath(useLocation().pathname);
  const qc = useQueryClient();
  const [alanId, setAlanId] = useState("1");
  const [metin, setMetin] = useState("");
  const { data = [], isLoading } = useQuery({
    queryKey: ["yetki-devri"],
    queryFn: async () => (await api.get<Devri[]>("/yetki-devri/")).data,
  });
  const create = useMutation({
    mutationFn: async () => {
      const now = new Date();
      const bitis = new Date(now.getTime() + 7 * 86400000);
      return api.post("/yetki-devri/", {
        alan_personel_id: Number(alanId),
        baslangic: now.toISOString(),
        bitis: bitis.toISOString(),
        duyuru_metni: metin,
      });
    },
    onSuccess: () => {
      setMetin("");
      qc.invalidateQueries({ queryKey: ["yetki-devri"] });
    },
  });

  return (
    <AppShell title="Yetki duyuruları" links={[{ to: root, label: "Ana" }]}>
      <div className="mb-6 space-y-2 rounded-xl border border-border p-4">
        <label className="block text-sm">
          Alan personel ID
          <Input value={alanId} onChange={(e) => setAlanId(e.target.value)} />
        </label>
        <label className="block text-sm">
          Duyuru metni
          <textarea
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            rows={3}
            value={metin}
            onChange={(e) => setMetin(e.target.value)}
          />
        </label>
        <Button
          onClick={() => create.mutate()}
          disabled={metin.trim().length < 5 || create.isPending}
        >
          Duyuru kaydet
        </Button>
        {create.isError && (
          <p className="text-sm text-red-600">{getApiErrorMessage(create.error)}</p>
        )}
      </div>
      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {data.map((d) => (
            <li key={d.id} className="rounded border border-border p-3">
              <div className="font-medium">Personel #{d.alan_personel_id}</div>
              <p className="text-muted-foreground">{d.duyuru_metni}</p>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}

export function BashekimSistemGozetimPage() {
  const root = roleRootFromPath(useLocation().pathname);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["sistem-gozetim"],
    queryFn: async () =>
      (await api.get<Sistem>("/yetki-devri/sistem-gozetim")).data,
  });
  return (
    <AppShell title="Sistem gözetim" links={[{ to: root, label: "Ana" }]}>
      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>
      ) : data ? (
        <dl className="grid max-w-lg gap-2 text-sm">
          <div className="flex justify-between border-b py-2">
            <dt>Health</dt>
            <dd>{data.health}</dd>
          </div>
          <div className="flex justify-between border-b py-2">
            <dt>Bildirim</dt>
            <dd>{data.bildirim_backend}</dd>
          </div>
          <div className="flex justify-between border-b py-2">
            <dt>CORS</dt>
            <dd className="max-w-[50%] truncate">{data.cors_origins}</dd>
          </div>
          <div className="flex justify-between border-b py-2">
            <dt>Login rate limit</dt>
            <dd>{data.login_rate_limit_per_minute}/dk</dd>
          </div>
          <div className="flex justify-between border-b py-2">
            <dt>Audit retention</dt>
            <dd>{data.audit_retention_days} gün</dd>
          </div>
        </dl>
      ) : null}
    </AppShell>
  );
}
