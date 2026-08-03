import { useState } from "react";
import {
  useRadyolojiGoruntuLink,
  useRadyolojiIstemleri,
  useRadyolojiRaporGir,
} from "@/entities/radyoloji";
import { RadyolojiIstemOlusturPanel } from "@/features/radyoloji-istem-olustur";
import { Button } from "@/shared/ui";
import { formatIstanbulDateTime, getApiErrorMessage } from "@/shared/lib";
import { useAuthStore } from "@/shared/auth";

export function RadyolojiPage() {
  const canIste = useAuthStore(
    (s) =>
      s.hasPermission("radyoloji:iste") ||
      s.hasRole("ADMIN", "BASHEKIM", "MUDUR", "DOKTOR"),
  );
  const canRapor = useAuthStore(
    (s) =>
      s.hasPermission("radyoloji:sonuc_gir") ||
      s.hasRole("ADMIN", "RADYOLOG"),
  );

  const { data: istemler = [], isLoading } = useRadyolojiIstemleri();
  const raporGir = useRadyolojiRaporGir();
  const [seciliId, setSeciliId] = useState<number | null>(null);
  const { data: link } = useRadyolojiGoruntuLink(seciliId);
  const [rapor, setRapor] = useState("");
  const [studyUid, setStudyUid] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function kaydetRapor(istemId: number) {
    setErr(null);
    try {
      await raporGir.mutateAsync({
        istemId,
        body: {
          rapor_metni: rapor.trim() || "Rapor girildi",
          orthanc_study_instance_uid: studyUid.trim(),
        },
      });
      setRapor("");
      setStudyUid("");
    } catch (e) {
      setErr(getApiErrorMessage(e));
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header>
        <h1 className="text-xl font-semibold">Radyoloji / PACS</h1>
        <p className="text-sm text-muted-foreground">
          Görüntüleme istemleri ve Orthanc bağlantısı
        </p>
      </header>

      {canIste ? <RadyolojiIstemOlusturPanel /> : null}

      <section className="corporate-panel rounded-lg p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide">
          İstemler
        </h2>
        {err ? <p className="mb-2 text-sm text-destructive">{err}</p> : null}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Yükleniyor…</p>
        ) : (
          <ul className="space-y-3">
            {istemler.map((i) => (
              <li key={i.id} className="rounded border px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-medium">
                      {i.tetkik_turu} — {i.vucut_bolgesi}
                    </span>
                    <span className="ml-2 text-muted-foreground">
                      {i.durum} · {formatIstanbulDateTime(i.istem_zamani)}
                    </span>
                    {i.sonuc?.rapor_metni ? (
                      <p className="mt-1 text-muted-foreground">
                        Rapor: {i.sonuc.rapor_metni}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setSeciliId(i.id)}
                    >
                      Görüntü linki
                    </Button>
                    {link?.viewer_url && seciliId === i.id ? (
                      <a
                        href={link.viewer_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                      >
                        Orthanc&apos;ta görüntüle
                      </a>
                    ) : null}
                  </div>
                </div>
                {canRapor && i.durum !== "RAPORLANDI" ? (
                  <div className="mt-2 space-y-2 border-t pt-2">
                    <input
                      className="w-full rounded border px-2 py-1 text-xs"
                      placeholder="Orthanc StudyInstanceUID"
                      value={studyUid}
                      onChange={(e) => setStudyUid(e.target.value)}
                    />
                    <textarea
                      className="w-full rounded border px-2 py-1 text-xs"
                      rows={2}
                      placeholder="Rapor metni"
                      value={rapor}
                      onChange={(e) => setRapor(e.target.value)}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => kaydetRapor(i.id)}
                      disabled={!studyUid.trim() || raporGir.isPending}
                    >
                      Rapor kaydet
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
