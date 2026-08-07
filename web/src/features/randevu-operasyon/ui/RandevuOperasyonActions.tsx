import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/shared/ui";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";
import type { Randevu } from "@/entities/randevu";
import { useAuthStore } from "@/shared/auth";

type Props = {
  randevu: Randevu & {
    medula_provizyon_no?: string | null;
    mhrs_randevu_id?: string | null;
  };
  compact?: boolean;
};

export function RandevuOperasyonActions({ randevu, compact }: Props) {
  const qc = useQueryClient();
  const canOlustur = useAuthStore((s) => s.hasPermission("randevu:olustur"));
  const canMhrs = useAuthStore((s) => s.hasPermission("mhrs:yonet"));

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["randevular"] });
  };

  const provizyon = useMutation({
    mutationFn: () => api.post<Randevu>(`/randevular/${randevu.id}/provizyon`),
    onSuccess: invalidate,
  });

  const gelmedi = useMutation({
    mutationFn: () => api.post<Randevu>(`/randevular/${randevu.id}/gelmedi`),
    onSuccess: invalidate,
  });

  const mhrs = useMutation({
    mutationFn: () => api.post<Randevu>(`/randevular/${randevu.id}/mhrs`),
    onSuccess: invalidate,
  });

  if (randevu.durum === "IPTAL" || randevu.durum === "GELMEDI") {
    return null;
  }

  const err =
    (provizyon.error && getApiErrorMessage(provizyon.error)) ||
    (gelmedi.error && getApiErrorMessage(gelmedi.error)) ||
    (mhrs.error && getApiErrorMessage(mhrs.error));

  const btnClass = compact ? "text-xs px-2 py-1" : "text-sm";

  return (
    <div className="flex flex-wrap items-center gap-1">
      {canOlustur && !randevu.medula_provizyon_no && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={btnClass}
          disabled={provizyon.isPending}
          onClick={() => provizyon.mutate()}
        >
          Provizyon
        </Button>
      )}
      {randevu.medula_provizyon_no && (
        <span className="text-xs text-muted-foreground" title="MEDULA provizyon">
          P: {randevu.medula_provizyon_no.slice(0, 8)}…
        </span>
      )}
      {canMhrs && !randevu.mhrs_randevu_id && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={btnClass}
          disabled={mhrs.isPending}
          onClick={() => mhrs.mutate()}
        >
          MHRS
        </Button>
      )}
      {canOlustur && randevu.durum === "BEKLEMEDE" && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={btnClass}
          disabled={gelmedi.isPending}
          onClick={() => gelmedi.mutate()}
        >
          Gelmedi
        </Button>
      )}
      {err && (
        <span className="text-xs text-red-600" role="alert">
          {err}
        </span>
      )}
    </div>
  );
}
