import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useServisDoluluk,
  useServisler,
  useServisYataklar,
  type YatakOzet,
} from "@/entities/yatak";
import { useYatakAta, useYatakBosalt } from "@/features/yatak-ata";
import { YatakHaritasi } from "@/widgets/yatak-haritasi";
import { Button } from "@/shared/ui";
import { fetchAllPages, getApiErrorMessage } from "@/shared/lib";
import { api } from "@/shared/api";
import { useAuthStore } from "@/shared/auth";

const IZOLASYON_TIPLERI = ["YOK", "DAMLACIK", "HAVA", "KONTAK"] as const;

type YatisKayit = {
  id: number;
  protokol_no: string;
  hasta_ad_soyad: string;
  yatak_id: number | null;
};

export function YatakYonetimiPage() {
  const qc = useQueryClient();
  const canAta = useAuthStore((s) =>
    s.hasPermission("yatak:ata") || s.hasRole("ADMIN", "BASHEKIM", "MUDUR"),
  );
  const canBosalt = useAuthStore((s) =>
    s.hasPermission("yatak:durum_guncelle") ||
    s.hasRole("ADMIN", "BASHEKIM", "MUDUR"),
  );

  const { data: servisler = [], isLoading: servisLoading } = useServisler();
  const [servisId, setServisId] = useState<number | null>(null);
  const aktifServisId = servisId ?? servisler[0]?.id ?? null;

  const { data: yataklar = [], isLoading: yatakLoading } =
    useServisYataklar(aktifServisId);
  const { data: doluluk } = useServisDoluluk(aktifServisId);

  const { data: yatislar = [] } = useQuery({
    queryKey: ["yatis-kayitlar-aktif-yatak"],
    queryFn: () =>
      fetchAllPages<YatisKayit>("/yatis/kayitlar", { aktif: true }),
  });

  const [seciliYatak, setSeciliYatak] = useState<YatakOzet | null>(null);
  const [yatisId, setYatisId] = useState("");
  const [yatisIzolasyon, setYatisIzolasyon] = useState("");
  const [yatakIzolasyon, setYatakIzolasyon] = useState("YOK");

  const patchYatakIzolasyon = useMutation({
    mutationFn: (payload: { yatakId: number; izolasyon: string }) =>
      api.patch(`/yatak-yonetimi/yataklar/${payload.yatakId}`, {
        izolasyon_tipi: payload.izolasyon,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["yatak-yonetimi-yataklar"] });
    },
  });

  const patchYatisIzolasyon = useMutation({
    mutationFn: (payload: { yatisId: number; izolasyon: string | null }) =>
      api.patch(`/yatis/kayitlar/${payload.yatisId}/izolasyon`, {
        izolasyon_gerekli: payload.izolasyon,
      }),
  });

  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (seciliYatak?.izolasyon_tipi) {
      setYatakIzolasyon(seciliYatak.izolasyon_tipi);
    } else {
      setYatakIzolasyon("YOK");
    }
  }, [seciliYatak?.id, seciliYatak?.izolasyon_tipi]);

  const ata = useYatakAta();
  const bosalt = useYatakBosalt();

  const yatisSecenekleri = useMemo(
    () => yatislar.filter((y) => !y.yatak_id || y.yatak_id === seciliYatak?.id),
    [yatislar, seciliYatak],
  );

  async function handleAta() {
    if (!seciliYatak || !yatisId) return;
    setErr(null);
    try {
      await ata.mutateAsync({
        yatakId: seciliYatak.id,
        yatisId: Number(yatisId),
      });
      setSeciliYatak(null);
      setYatisId("");
    } catch (e) {
      setErr(getApiErrorMessage(e));
    }
  }

  async function handleBosalt() {
    if (!seciliYatak) return;
    setErr(null);
    try {
      await bosalt.mutateAsync(seciliYatak.id);
      setSeciliYatak(null);
    } catch (e) {
      setErr(getApiErrorMessage(e));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Yatak Yönetimi</h1>
        <p className="text-sm text-[color:var(--text-secondary)]">
          Servis doluluk haritası — yeşil boş, kırmızı dolu, sarı temizlik bekliyor.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Servis
          <select
            className="rounded-lg border border-[color:var(--border-subtle)] bg-transparent px-3 py-2"
            value={aktifServisId ?? ""}
            onChange={(e) => setServisId(Number(e.target.value))}
            disabled={servisLoading || servisler.length === 0}
          >
            {servisler.map((s) => (
              <option key={s.id} value={s.id}>
                {s.ad} ({s.kod})
              </option>
            ))}
          </select>
        </label>
        {doluluk && (
          <p className="text-sm text-[color:var(--text-secondary)]">
            Boş {doluluk.bos} · Dolu {doluluk.dolu} · Temizlik {doluluk.temizlik_bekliyor} ·
            Arızalı {doluluk.arizali}
          </p>
        )}
      </div>

      {yatakLoading ? (
        <p className="text-sm text-[color:var(--text-secondary)]">Yataklar yükleniyor…</p>
      ) : (
        <YatakHaritasi
          yataklar={yataklar}
          seciliYatakId={seciliYatak?.id}
          onYatakSec={setSeciliYatak}
        />
      )}

      {seciliYatak && (
        <div className="rounded-xl border border-[color:var(--border-subtle)] p-4 space-y-3">
          <p className="font-medium">
            Seçili: Oda {seciliYatak.oda_no} / Yatak {seciliYatak.yatak_no} (
            {seciliYatak.durum})
          </p>
          {seciliYatak.durum === "BOS" && canAta && (
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex flex-col gap-1 text-sm">
                Yatış kaydı
                <select
                  className="min-w-[16rem] rounded-lg border border-[color:var(--border-subtle)] px-3 py-2"
                  value={yatisId}
                  onChange={(e) => setYatisId(e.target.value)}
                >
                  <option value="">Seçin</option>
                  {yatisSecenekleri.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.protokol_no} — {y.hasta_ad_soyad}
                    </option>
                  ))}
                </select>
              </label>
              <Button onClick={handleAta} disabled={!yatisId || ata.isPending}>
                Yatak ata
              </Button>
            </div>
          )}
          {seciliYatak.durum === "DOLU" && canBosalt && (
            <Button variant="secondary" onClick={handleBosalt} disabled={bosalt.isPending}>
              Yatağı boşalt (temizlik)
            </Button>
          )}
          {canBosalt && (
            <div className="flex flex-wrap items-end gap-2 border-t border-[color:var(--border-subtle)] pt-3">
              <label className="flex flex-col gap-1 text-sm">
                Yatak izolasyon tipi
                <select
                  className="rounded-lg border border-[color:var(--border-subtle)] px-3 py-2"
                  value={yatakIzolasyon}
                  onChange={(e) => setYatakIzolasyon(e.target.value)}
                >
                  {IZOLASYON_TIPLERI.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                type="button"
                variant="outline"
                disabled={patchYatakIzolasyon.isPending}
                onClick={() => {
                  setErr(null);
                  patchYatakIzolasyon.mutate(
                    { yatakId: seciliYatak.id, izolasyon: yatakIzolasyon },
                    { onError: (e) => setErr(getApiErrorMessage(e)) },
                  );
                }}
              >
                İzolasyon kaydet
              </Button>
            </div>
          )}
          {canAta && (
            <div className="flex flex-wrap items-end gap-2 border-t border-[color:var(--border-subtle)] pt-3">
              <label className="flex flex-col gap-1 text-sm">
                Yatış izolasyon gereksinimi
                <select
                  className="rounded-lg border border-[color:var(--border-subtle)] px-3 py-2"
                  value={yatisIzolasyon}
                  onChange={(e) => setYatisIzolasyon(e.target.value)}
                >
                  <option value="">YOK</option>
                  {IZOLASYON_TIPLERI.filter((t) => t !== "YOK").map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Yatış kayıt ID
                <input
                  className="w-28 rounded-lg border border-[color:var(--border-subtle)] px-3 py-2"
                  value={yatisId}
                  onChange={(e) => setYatisId(e.target.value)}
                  placeholder="ID"
                />
              </label>
              <Button
                type="button"
                variant="outline"
                disabled={!yatisId || patchYatisIzolasyon.isPending}
                onClick={() => {
                  setErr(null);
                  patchYatisIzolasyon.mutate(
                    {
                      yatisId: Number(yatisId),
                      izolasyon: yatisIzolasyon || null,
                    },
                    { onError: (e) => setErr(getApiErrorMessage(e)) },
                  );
                }}
              >
                Yatış izolasyonu
              </Button>
            </div>
          )}
        </div>
      )}

      {err && <p className="text-sm text-red-600">{err}</p>}
    </div>
  );
}
