import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  TemizlikCizelgeTablosu,
  TemizlikPersonelChip,
  TemizlikSilAlani,
  birlestirBolgeler,
  mondayOfWeek,
  normalizeIsoDate,
  parseTemizlikCellId,
  parseTemizlikDragId,
  shiftWeek,
  temizlikSilDropId,
  type TemizlikGorev,
  type TemizlikPersonel,
} from "@/features/temizlik-cizelgesi";
import {
  removeTemizlikGorev,
  upsertTemizlikGorev,
} from "@/features/temizlik-cizelgesi/lib/gorev-cache";
import { AppShell, Button } from "@/shared/ui";
import { api } from "@/shared/api";
import {
  fetchAllPages,
  getApiErrorMessage,
  LOOKUP_PAGE_SIZE,
  unwrapPage,
  type PageResponse,
} from "@/shared/lib";
import { roleRootFromPath } from "@/shared/lib/role-root";
import { useAuthStore } from "@/shared/auth";

export function TemizlikAtaPage() {
  const qc = useQueryClient();
  const location = useLocation();
  const roleRoot = roleRootFromPath(location.pathname);
  const canEdit = useAuthStore((s) =>
    s.hasRole("ADMIN", "BASHEKIM", "MUDUR"),
  );

  const [haftaBaslangic, setHaftaBaslangic] = useState(() => mondayOfWeek());
  const [yeniBolge, setYeniBolge] = useState("");
  const [ekBolgeler, setEkBolgeler] = useState<string[]>([]);
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const { data: personeller = [] } = useQuery({
    queryKey: ["personeller", "TEMIZLIK_PERSONELI"],
    queryFn: async () =>
      unwrapPage(
        (
          await api.get<PageResponse<TemizlikPersonel>>("/personel/", {
            params: { rol: "TEMIZLIK_PERSONELI", page_size: LOOKUP_PAGE_SIZE },
          })
        ).data,
      ),
    enabled: canEdit,
  });

  const gorevQueryKey = ["temizlik-yonetim", haftaBaslangic] as const;

  const { data: gorevler = [], isLoading, isError, error } = useQuery({
    queryKey: gorevQueryKey,
    queryFn: () =>
      fetchAllPages<TemizlikGorev>("/temizlik-gorevleri/", {
        hafta_baslangic: haftaBaslangic,
      }),
  });

  const bolgeler = useMemo(
    () =>
      birlestirBolgeler(
        gorevler.map((g) => g.oda_bolum),
        ekBolgeler,
      ),
    [gorevler, ekBolgeler],
  );

  const gorevById = useMemo(() => {
    const m = new Map<number, TemizlikGorev>();
    for (const g of gorevler) m.set(g.id, g);
    return m;
  }, [gorevler]);

  const patchGorevCache = (updater: (prev: TemizlikGorev[]) => TemizlikGorev[]) => {
    qc.setQueryData<TemizlikGorev[]>(gorevQueryKey, (prev = []) => updater(prev));
  };

  const refetchHafta = () => qc.invalidateQueries({ queryKey: gorevQueryKey });

  const createMut = useMutation({
    mutationFn: async (body: {
      personel_id: number;
      oda_bolum: string;
      gorev_tarihi: string;
    }) => (await api.post<TemizlikGorev>("/temizlik-gorevleri/", body)).data,
    onSuccess: (created) => {
      patchGorevCache((prev) => upsertTemizlikGorev(prev, created));
      void refetchHafta();
    },
  });

  const updateMut = useMutation({
    mutationFn: async ({
      id,
      ...body
    }: {
      id: number;
      personel_id?: number;
      oda_bolum?: string;
      gorev_tarihi?: string;
    }) =>
      (await api.patch<TemizlikGorev>(`/temizlik-gorevleri/${id}`, body)).data,
    onSuccess: (updated) => {
      patchGorevCache((prev) => upsertTemizlikGorev(prev, updated));
      void refetchHafta();
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/temizlik-gorevleri/${id}`);
      return id;
    },
    onSuccess: (id) => {
      patchGorevCache((prev) => removeTemizlikGorev(prev, id));
      void refetchHafta();
    },
  });

  async function onDragEnd(event: DragEndEvent) {
    setActiveLabel(null);
    if (!canEdit) return;
    const { active, over } = event;
    if (!over) return;

    const drag = parseTemizlikDragId(String(active.id));
    if (!drag) return;

    setErr(null);

    if (over.id === temizlikSilDropId) {
      if (drag.kind === "gorev") {
        try {
          await deleteMut.mutateAsync(drag.gorevId);
        } catch (e) {
          setErr(getApiErrorMessage(e));
        }
      }
      return;
    }

    const cell = parseTemizlikCellId(String(over.id));
    if (!cell) return;

    try {
      if (drag.kind === "pool") {
        await createMut.mutateAsync({
          personel_id: drag.personelId,
          oda_bolum: cell.odaBolum,
          gorev_tarihi: cell.tarih,
        });
        return;
      }

      const occupied = gorevler.find(
        (g) =>
          g.id !== drag.gorevId &&
          g.oda_bolum === cell.odaBolum &&
          normalizeIsoDate(g.gorev_tarihi) === cell.tarih,
      );
      if (occupied) {
        setErr("Hedef hücre dolu.");
        return;
      }

      await updateMut.mutateAsync({
        id: drag.gorevId,
        oda_bolum: cell.odaBolum,
        gorev_tarihi: cell.tarih,
      });
    } catch (e) {
      setErr(getApiErrorMessage(e));
    }
  }

  const adminLink =
    roleRoot === "/admin"
      ? [{ to: "/admin", label: "Admin" }]
      : [{ to: roleRoot, label: "Panel" }];

  return (
    <AppShell title="Temizlik görevleri" links={adminLink}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setHaftaBaslangic((w) => shiftWeek(w, -1))}
        >
          Önceki hafta
        </Button>
        <input
          type="date"
          className="rounded-md border px-2 py-1.5 text-sm"
          value={haftaBaslangic}
          onChange={(e) =>
            setHaftaBaslangic(mondayOfWeek(new Date(e.target.value)))
          }
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setHaftaBaslangic((w) => shiftWeek(w, 1))}
        >
          Sonraki hafta
        </Button>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        Yalnızca temizlik personeli atanabilir. Personeli hücreye sürükleyin;
        görevi kaldırmak için alttaki alana bırakın.
      </p>

      {err && (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {err}
        </p>
      )}

      {canEdit && (
        <form
          className="mb-4 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const t = yeniBolge.trim();
            if (!t) return;
            setEkBolgeler((prev) => [...prev, t]);
            setYeniBolge("");
          }}
        >
          <input
            className="rounded-md border px-3 py-2 text-sm"
            placeholder="Yeni bölüm / oda satırı"
            value={yeniBolge}
            onChange={(e) => setYeniBolge(e.target.value)}
          />
          <Button type="submit" variant="secondary" size="sm">
            Satır ekle
          </Button>
        </form>
      )}

      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600" role="alert">
          {getApiErrorMessage(error)}
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={(e) => {
            const drag = parseTemizlikDragId(String(e.active.id));
            if (drag?.kind === "pool") {
              const p = personeller.find((x) => x.id === drag.personelId);
              setActiveLabel(
                p
                  ? `${p.ad ?? ""} ${p.soyad ?? ""}`.trim() || p.sicil_no
                  : null,
              );
            } else if (drag?.kind === "gorev") {
              setActiveLabel(
                gorevById.get(drag.gorevId)?.personel_ad_soyad ?? null,
              );
            }
          }}
          onDragEnd={onDragEnd}
          onDragCancel={() => setActiveLabel(null)}
        >
          <div className="space-y-6">
            <TemizlikCizelgeTablosu
              bolgeler={bolgeler}
              haftaBaslangic={haftaBaslangic}
              gorevler={gorevler}
              canEdit={canEdit}
            />

            {canEdit && (
              <>
                <div className="rounded-lg border bg-[var(--panel-inset-bg)] p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Temizlik personeli
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {personeller.map((p) => (
                      <div key={p.id} className="w-36">
                        <TemizlikPersonelChip
                          personelId={p.id}
                          label={
                            `${p.ad ?? ""} ${p.soyad ?? ""}`.trim() || p.sicil_no
                          }
                        />
                      </div>
                    ))}
                    {!personeller.length && (
                      <span className="text-xs text-muted-foreground">
                        Temizlik personeli kaydı yok.
                      </span>
                    )}
                  </div>
                </div>
                <TemizlikSilAlani canEdit={canEdit} />
              </>
            )}
          </div>
          <DragOverlay dropAnimation={null}>
            {activeLabel ? (
              <div className="rounded border bg-card px-3 py-2 text-sm shadow-md">
                {activeLabel}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </AppShell>
  );
}
