import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppShell, Badge, Button, ListPager } from "@/shared/ui";
import { api } from "@/shared/api";
import { useAuthStore } from "@/shared/auth";
import {
  formatIstanbulDateTime,
  pageTotal,
  unwrapPage,
  type PageResponse,
} from "@/shared/lib";

type SikayetKaynak = "HASTA" | "DOKTOR" | "PERSONEL";
type SikayetSiralama = "yeni_once" | "eski_once";

type Sikayet = {
  id: number;
  gonderen_kullanici_id: number;
  tur: string;
  icerik: string;
  tarih: string;
  durum: string;
  gonderen_ad_soyad?: string | null;
  gonderen_rol?: string | null;
  kaynak_grubu: SikayetKaynak;
};

const PAGE_SIZE = 20;

const KAYNAK_ETIKET: Record<SikayetKaynak, string> = {
  HASTA: "Hasta",
  DOKTOR: "Doktor",
  PERSONEL: "Personel",
};

const KAYNAK_SIRASI: SikayetKaynak[] = ["HASTA", "DOKTOR", "PERSONEL"];

function SikayetListe({
  items,
  siralama,
}: {
  items: Sikayet[];
  siralama: SikayetSiralama;
}) {
  const sorted = useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => {
      const ta = new Date(a.tarih).getTime();
      const tb = new Date(b.tarih).getTime();
      return siralama === "eski_once" ? ta - tb : tb - ta;
    });
    return copy;
  }, [items, siralama]);

  if (!sorted.length) {
    return (
      <p className="text-sm text-muted-foreground">Bu filtrede kayıt yok.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {sorted.map((s) => (
        <li
          key={s.id}
          className="rounded-md border border-l-4 bg-card p-3 text-sm corporate-panel"
          style={{
            borderLeftColor:
              s.kaynak_grubu === "HASTA"
                ? "var(--status-acil-fg)"
                : s.kaynak_grubu === "DOKTOR"
                  ? "var(--nav-active-bg)"
                  : "var(--nav-active-bg)",
          }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{KAYNAK_ETIKET[s.kaynak_grubu]}</Badge>
            <Badge variant={s.tur === "ONERI" ? "tamamlandi" : "beklemede"}>
              {s.tur === "ONERI" ? "Öneri" : "Şikayet"}
            </Badge>
            <Badge variant={s.durum === "ACIK" ? "acil" : "iptal"}>
              {s.durum}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatIstanbulDateTime(s.tarih)}
            </span>
          </div>
          <p className="mt-2 font-medium text-[color:var(--text-primary)]">
            {s.gonderen_ad_soyad ?? `Kullanıcı #${s.gonderen_kullanici_id}`}
            {s.gonderen_rol ? (
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                ({s.gonderen_rol})
              </span>
            ) : null}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
            {s.icerik}
          </p>
        </li>
      ))}
    </ul>
  );
}

function useSikayetQuery(
  enabled: boolean,
  params: Record<string, string | number | undefined>,
) {
  return useQuery({
    queryKey: ["sikayetler", params],
    queryFn: async () =>
      (
        await api.get<PageResponse<Sikayet>>("/sikayet-oneri/", {
          params: { page_size: PAGE_SIZE, ...params },
        })
      ).data,
    enabled,
  });
}

function SikayetKaynakBolumu({
  kaynak,
  siralama,
  tur,
  durum,
  tarihBas,
  tarihBit,
}: {
  kaynak: SikayetKaynak;
  siralama: SikayetSiralama;
  tur: string;
  durum: string;
  tarihBas: string;
  tarihBit: string;
}) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useSikayetQuery(true, {
    page,
    siralama,
    kaynak,
    tur: tur || undefined,
    durum: durum || undefined,
    tarih_baslangic: tarihBas ? `${tarihBas}T00:00:00` : undefined,
    tarih_bitis: tarihBit ? `${tarihBit}T23:59:59` : undefined,
  });
  const liste = unwrapPage(data ?? []);
  const total = pageTotal(data ?? []);

  return (
    <section className="space-y-3">
      <h3
        className="text-sm font-semibold uppercase tracking-wide"
        style={{ color: "var(--text-primary)" }}
      >
        {KAYNAK_ETIKET[kaynak]}
      </h3>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Yükleniyor…</p>
      ) : (
        <>
          <SikayetListe items={liste} siralama={siralama} />
          <ListPager
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
          />
        </>
      )}
    </section>
  );
}

export function SikayetOneriPage() {
  const qc = useQueryClient();
  const canListAll = useAuthStore((s) =>
    s.hasRole("ADMIN", "BASHEKIM", "MUDUR"),
  );
  const [page, setPage] = useState(1);

  const [siralama, setSiralama] = useState<SikayetSiralama>("yeni_once");
  const [kaynak, setKaynak] = useState<"" | SikayetKaynak>("");
  const [tur, setTur] = useState<"" | "SIKAYET" | "ONERI">("");
  const [durum, setDurum] = useState<"" | "ACIK" | "KAPALI">("");
  const [tarihBas, setTarihBas] = useState("");
  const [tarihBit, setTarihBit] = useState("");

  const [formTur, setFormTur] = useState("SIKAYET");
  const [icerik, setIcerik] = useState("");

  const tekListe = kaynak !== "";

  const { data, isLoading } = useSikayetQuery(canListAll && tekListe, {
    page,
    siralama,
    kaynak: kaynak || undefined,
    tur: tur || undefined,
    durum: durum || undefined,
    tarih_baslangic: tarihBas ? `${tarihBas}T00:00:00` : undefined,
    tarih_bitis: tarihBit ? `${tarihBit}T23:59:59` : undefined,
  });
  const liste = unwrapPage(data ?? []);
  const total = pageTotal(data ?? []);

  const gonder = useMutation({
    mutationFn: async () =>
      api.post("/sikayet-oneri/", { tur: formTur, icerik }),
    onSuccess: () => {
      setIcerik("");
      qc.invalidateQueries({ queryKey: ["sikayetler"] });
    },
  });

  function resetSayfa() {
    setPage(1);
  }

  return (
    <AppShell title="Şikayet / Öneri">
      {!canListAll && (
        <form
          className="mb-6 max-w-lg space-y-3 rounded border bg-card p-4"
          onSubmit={(e) => {
            e.preventDefault();
            gonder.mutate();
          }}
        >
          <select
            className="w-full rounded border px-3 py-2"
            value={formTur}
            onChange={(e) => setFormTur(e.target.value)}
          >
            <option value="SIKAYET">Şikayet</option>
            <option value="ONERI">Öneri</option>
          </select>
          <textarea
            className="w-full rounded border px-3 py-2"
            rows={4}
            placeholder="Mesajınız"
            value={icerik}
            onChange={(e) => setIcerik(e.target.value)}
            required
          />
          <Button type="submit" disabled={gonder.isPending}>
            Gönder
          </Button>
          {gonder.isSuccess && (
            <p className="text-sm text-emerald-700">Gönderildi.</p>
          )}
        </form>
      )}

      {canListAll && (
        <section className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Kayıtları zaman ve kaynağa göre süzün; tüm kaynaklar seçiliyken hasta,
            doktor ve personel ayrı listelenir.
          </p>

          <div className="space-y-4 rounded-lg border bg-[var(--panel-inset-bg)] p-4">
            <div>
              <p className="page-eyebrow mb-2">1 — Zaman</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={siralama === "yeni_once" ? "default" : "outline"}
                  onClick={() => {
                    setSiralama("yeni_once");
                    resetSayfa();
                  }}
                >
                  En yeni önce
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={siralama === "eski_once" ? "default" : "outline"}
                  onClick={() => {
                    setSiralama("eski_once");
                    resetSayfa();
                  }}
                >
                  En eski önce
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <label className="flex items-center gap-1 text-sm">
                  Başlangıç
                  <input
                    type="date"
                    className="rounded border px-2 py-1"
                    value={tarihBas}
                    onChange={(e) => {
                      setTarihBas(e.target.value);
                      resetSayfa();
                    }}
                  />
                </label>
                <label className="flex items-center gap-1 text-sm">
                  Bitiş
                  <input
                    type="date"
                    className="rounded border px-2 py-1"
                    value={tarihBit}
                    onChange={(e) => {
                      setTarihBit(e.target.value);
                      resetSayfa();
                    }}
                  />
                </label>
              </div>
            </div>

            <div>
              <p className="page-eyebrow mb-2">2 — Kaynak</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={kaynak === "" ? "default" : "outline"}
                  onClick={() => {
                    setKaynak("");
                    resetSayfa();
                  }}
                >
                  Tümü (ayrı listeler)
                </Button>
                {KAYNAK_SIRASI.map((k) => (
                  <Button
                    key={k}
                    type="button"
                    size="sm"
                    variant={kaynak === k ? "default" : "outline"}
                    onClick={() => {
                      setKaynak(k);
                      resetSayfa();
                    }}
                  >
                    {KAYNAK_ETIKET[k]}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <p className="page-eyebrow mb-2">3 — Tür ve durum</p>
              <div className="flex flex-wrap gap-2">
                <select
                  className="rounded border px-2 py-1.5 text-sm"
                  value={tur}
                  onChange={(e) => {
                    setTur(e.target.value as typeof tur);
                    resetSayfa();
                  }}
                >
                  <option value="">Tüm türler</option>
                  <option value="SIKAYET">Şikayet</option>
                  <option value="ONERI">Öneri</option>
                </select>
                <select
                  className="rounded border px-2 py-1.5 text-sm"
                  value={durum}
                  onChange={(e) => {
                    setDurum(e.target.value as typeof durum);
                    resetSayfa();
                  }}
                >
                  <option value="">Tüm durumlar</option>
                  <option value="ACIK">Açık</option>
                  <option value="KAPALI">Kapalı</option>
                </select>
              </div>
            </div>
          </div>

          {tekListe ? (
            isLoading ? (
              <p className="text-sm text-muted-foreground">Yükleniyor…</p>
            ) : (
              <>
                <SikayetListe items={liste} siralama={siralama} />
                <ListPager
                  page={page}
                  pageSize={PAGE_SIZE}
                  total={total}
                  onPageChange={setPage}
                />
              </>
            )
          ) : (
            <div className="space-y-10">
              {KAYNAK_SIRASI.map((k) => (
                <SikayetKaynakBolumu
                  key={k}
                  kaynak={k}
                  siralama={siralama}
                  tur={tur}
                  durum={durum}
                  tarihBas={tarihBas}
                  tarihBit={tarihBit}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </AppShell>
  );
}
