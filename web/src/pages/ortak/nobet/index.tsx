import {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, ChevronRight, X } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  NobetDepartmanPanel,
  mondayOfWeek,
  parseDragId,
  resolveNobetCellFromDragEnd,
  shiftWeek,
  type Departman,
  type NobetKaydi,
  type NobetPersonel,
} from "@/features/nobet-cizelgesi";
import { personelTamEtiket } from "@/features/nobet-cizelgesi/lib/personel-label";
import {
  removeNobetKaydi,
  upsertNobetKaydi,
} from "@/features/nobet-cizelgesi/lib/nobet-cache";
import { AppShell, Button } from "@/shared/ui";
import { api } from "@/shared/api";
import {
  fetchAllPages,
  getApiErrorMessage,
  LOOKUP_PAGE_SIZE,
  unwrapPage,
  type PageResponse,
} from "@/shared/lib";
import { cn } from "@/shared/lib/utils";
import { roleRootFromPath } from "@/shared/lib/role-root";
import { useAuthStore } from "@/shared/auth";

export function NobetYonetimiPage() {
  const qc = useQueryClient();
  const location = useLocation();
  const roleRoot = roleRootFromPath(location.pathname);
  const canEdit = useAuthStore((s) =>
    s.hasRole("ADMIN", "BASHEKIM", "MUDUR"),
  );

  const [haftaBaslangic, setHaftaBaslangic] = useState(() => mondayOfWeek());
  const [openDepartmanId, setOpenDepartmanId] = useState<number | null>(null);
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const modalTitleId = useId();

  useEffect(() => {
    if (openDepartmanId == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenDepartmanId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openDepartmanId]);

  useEffect(() => {
    if (openDepartmanId == null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [openDepartmanId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
  );

  const { data: departmanlar = [] } = useQuery({
    queryKey: ["departmanlar"],
    queryFn: async () => (await api.get<Departman[]>("/departmanlar/")).data,
  });

  const nobetQueryKey = ["nobetler", haftaBaslangic] as const;

  const { data: nobetler = [], isLoading, isError, error } = useQuery({
    queryKey: nobetQueryKey,
    queryFn: () =>
      fetchAllPages<NobetKaydi>("/nobet-cizelgesi/", {
        hafta_baslangic: haftaBaslangic,
      }),
  });

  const { data: personeller = [] } = useQuery({
    queryKey: ["personeller-nobet"],
    queryFn: async () =>
      unwrapPage(
        (
          await api.get<PageResponse<NobetPersonel>>("/personel/", {
            params: { page_size: LOOKUP_PAGE_SIZE },
          })
        ).data,
      ),
    enabled: canEdit,
  });

  const nobetById = useMemo(() => {
    const m = new Map<number, NobetKaydi>();
    for (const n of nobetler) m.set(n.id, n);
    return m;
  }, [nobetler]);

  const nobetCountByDep = useMemo(() => {
    const m = new Map<number, number>();
    for (const n of nobetler) {
      m.set(n.departman_id, (m.get(n.departman_id) ?? 0) + 1);
    }
    return m;
  }, [nobetler]);

  const openDepartman = departmanlar.find((d) => d.id === openDepartmanId);

  const patchNobetCache = (updater: (prev: NobetKaydi[]) => NobetKaydi[]) => {
    qc.setQueryData<NobetKaydi[]>(nobetQueryKey, (prev = []) => updater(prev));
  };

  const refetchNobet = () => qc.invalidateQueries({ queryKey: nobetQueryKey });

  const createMut = useMutation({
    mutationFn: async (body: {
      personel_id: number;
      departman_id: number;
      tarih: string;
      vardiya: string;
      sira?: number;
    }) => (await api.post<NobetKaydi>("/nobet-cizelgesi/", body)).data,
    onSuccess: (created) => {
      patchNobetCache((prev) => upsertNobetKaydi(prev, created));
      void refetchNobet();
    },
  });

  const updateMut = useMutation({
    mutationFn: async ({
      id,
      ...body
    }: {
      id: number;
      personel_id?: number;
      departman_id?: number;
      tarih?: string;
      vardiya?: string;
      sira?: number;
    }) => (await api.patch<NobetKaydi>(`/nobet-cizelgesi/${id}`, body)).data,
    onSuccess: (updated) => {
      patchNobetCache((prev) => upsertNobetKaydi(prev, updated));
      void refetchNobet();
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/nobet-cizelgesi/${id}`);
      return id;
    },
    onSuccess: (id) => {
      patchNobetCache((prev) => removeNobetKaydi(prev, id));
      void refetchNobet();
    },
  });

  async function assignNobet(body: {
    personel_id: number;
    departman_id: number;
    tarih: string;
    vardiya: string;
  }) {
    setErr(null);
    try {
      await createMut.mutateAsync({ ...body, sira: 0 });
    } catch (e) {
      setErr(getApiErrorMessage(e));
    }
  }

  async function onDragEnd(event: DragEndEvent) {
    setActiveLabel(null);
    if (!canEdit || openDepartmanId == null) return;

    const drag = parseDragId(String(event.active.id));
    if (!drag) return;

    const cell = resolveNobetCellFromDragEnd(event);
    if (!cell || cell.departmanId !== openDepartmanId) {
      if (event.over) {
        setErr("Hedef hücre algılanamadı. Boş alana bırakmayı deneyin.");
      }
      return;
    }

    setErr(null);
    try {
      if (drag.kind === "pool") {
        await createMut.mutateAsync({
          personel_id: drag.personelId,
          departman_id: cell.departmanId,
          tarih: cell.tarih,
          vardiya: cell.vardiya,
          sira: cell.sira,
        });
        return;
      }

      const occupied = nobetler.find(
        (n) =>
          n.id !== drag.nobetId &&
          n.departman_id === cell.departmanId &&
          n.tarih.slice(0, 10) === cell.tarih &&
          n.vardiya === cell.vardiya &&
          (n.sira ?? 0) === cell.sira,
      );
      if (occupied) {
        setErr("Hedef hücre dolu.");
        return;
      }

      await updateMut.mutateAsync({
        id: drag.nobetId,
        departman_id: cell.departmanId,
        tarih: cell.tarih,
        vardiya: cell.vardiya,
        sira: cell.sira,
      });
    } catch (e) {
      setErr(getApiErrorMessage(e));
    }
  }

  const adminLink =
    roleRoot === "/admin"
      ? [{ to: "/admin", label: "Admin" }]
      : [{ to: roleRoot, label: "Panel" }];

  const assignPending = createMut.isPending || updateMut.isPending;

  return (
    <AppShell title="Nöbet Çizelgesi" links={canEdit ? adminLink : []}>
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
        Departmana tıklayın; çizelge pencerede açılır. Nöbet atamak için formu
        kullanın veya personeli sürükleyip hücreye bırakın.
      </p>

      {err && !openDepartmanId && (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {err}
        </p>
      )}

      {isLoading ? (
        <p>Yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-red-600" role="alert">
          {getApiErrorMessage(error)}
        </p>
      ) : canEdit ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {departmanlar.map((dep) => {
              const selected = openDepartmanId === dep.id;
              const count = nobetCountByDep.get(dep.id) ?? 0;
              return (
                <button
                  key={dep.id}
                  type="button"
                  onClick={() => {
                    setErr(null);
                    setOpenDepartmanId(dep.id);
                  }}
                  className={cn(
                    "rounded-xl border p-4 text-left transition",
                    "bg-card hover:opacity-95",
                    selected
                      ? "border-[var(--border-accent)] ring-1 ring-[var(--border-accent)]"
                      : "border-border",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                        style={{
                          background: "var(--panel-inset-bg)",
                          color: "var(--nav-active-bg)",
                        }}
                      >
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold leading-snug">{dep.ad}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          Bu hafta {count} nöbet
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                </button>
              );
            })}
          </div>

          {openDepartman && (
            <div
              className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-3 sm:p-6"
              role="presentation"
            >
              <button
                type="button"
                aria-label="Kapat"
                className="fixed inset-0 bg-black/45"
                onClick={() => setOpenDepartmanId(null)}
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={modalTitleId}
                className="relative z-10 my-2 flex w-full max-w-6xl flex-col rounded-2xl border border-border bg-card shadow-xl sm:my-4"
              >
                <DndContext
                  sensors={sensors}
                  collisionDetection={pointerWithin}
                  measuring={{
                    droppable: { strategy: MeasuringStrategy.Always },
                  }}
                  onDragStart={(e) => {
                    const drag = parseDragId(String(e.active.id));
                    if (drag?.kind === "pool") {
                      const p = personeller.find(
                        (x) => x.id === drag.personelId,
                      );
                      setActiveLabel(p ? personelTamEtiket(p) : null);
                    } else if (drag?.kind === "nobet") {
                      setActiveLabel(
                        nobetById.get(drag.nobetId)?.personel_ad_soyad ??
                          null,
                      );
                    }
                  }}
                  onDragEnd={onDragEnd}
                  onDragCancel={() => setActiveLabel(null)}
                >
                  <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
                    <div>
                      <h2
                        id={modalTitleId}
                        className="text-lg font-semibold tracking-tight"
                      >
                        {openDepartman.ad}
                      </h2>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        Hafta: {haftaBaslangic}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="shrink-0"
                      aria-label="Pencereyi kapat"
                      onClick={() => setOpenDepartmanId(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="max-h-[min(78vh,52rem)] overflow-y-auto p-4 sm:p-5">
                    {err && (
                      <p className="mb-3 text-sm text-red-600" role="alert">
                        {err}
                      </p>
                    )}

                    <NobetDepartmanPanel
                      departmanId={openDepartman.id}
                      departmanAd={openDepartman.ad}
                      haftaBaslangic={haftaBaslangic}
                      nobetler={nobetler}
                      personeller={personeller}
                      canEdit={canEdit}
                      assignPending={assignPending}
                      onAssign={assignNobet}
                      onDeleteNobet={(id) => deleteMut.mutate(id)}
                    />
                  </div>
                  <DragOverlay dropAnimation={null} className="z-[200]">
                    {activeLabel ? (
                      <div className="rounded border bg-card px-3 py-2 text-xs shadow-md">
                        {activeLabel}
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              </div>
            </div>
          )}
        </>
      ) : (
        <ul className="mt-4 space-y-2 text-sm">
          <li className="font-medium">Nöbetlerim</li>
          {nobetler.map((n) => (
            <li key={n.id} className="text-muted-foreground">
              {n.tarih.slice(0, 10)} · {n.vardiya} ·{" "}
              {n.departman_ad ?? n.departman_id}
            </li>
          ))}
          {!nobetler.length && (
            <li className="text-muted-foreground">Kayıt yok.</li>
          )}
        </ul>
      )}
    </AppShell>
  );
}
