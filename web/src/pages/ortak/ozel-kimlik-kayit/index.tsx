import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { AppShell, Button } from "@/shared/ui";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";
import { roleRootFromPath } from "@/shared/lib/role-root";

const KIMLIK_TIPLERI = [
  "YENIDOGAN",
  "YABANCI",
  "GECICI_PROTOKOL",
] as const;

export function OzelKimlikKayitPage() {
  const roleRoot = roleRootFromPath(useLocation().pathname);
  const [form, setForm] = useState({
    kimlik_tipi: "YENIDOGAN" as (typeof KIMLIK_TIPLERI)[number],
    ad: "",
    soyad: "",
    yabanci_kimlik_no: "",
    gecici_protokol_no: "",
    telefon: "",
    email: "",
    sifre: "Test1234!",
    cinsiyet: "",
    dogum_tarihi: "",
  });
  const [msg, setMsg] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: async () =>
      (
        await api.post<{ id: string; tc_kimlik_no: string }>(
          "/hastalar/ozel-kimlik",
          {
            ...form,
            email: form.email || undefined,
            telefon: form.telefon || undefined,
            yabanci_kimlik_no: form.yabanci_kimlik_no || undefined,
            gecici_protokol_no: form.gecici_protokol_no || undefined,
            dogum_tarihi: form.dogum_tarihi || undefined,
            cinsiyet: form.cinsiyet || undefined,
            sifre: form.sifre || undefined,
          },
        )
      ).data,
    onSuccess: (h) => setMsg(`Kayıt oluşturuldu — TC/protokol: ${h.tc_kimlik_no}`),
    onError: (e) => setMsg(getApiErrorMessage(e)),
  });

  return (
    <AppShell
      title="Özel kimlik kaydı"
      links={[{ to: roleRoot, label: "Ana" }]}
    >
      <p className="mb-4 text-sm text-muted-foreground">
        Yenidoğan, yabancı kimlik veya geçici protokol ile hasta kaydı.
      </p>
      <form
        className="grid max-w-md gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          mut.mutate();
        }}
      >
        <label className="text-sm">
          Kimlik tipi
          <select
            className="mt-1 w-full rounded border px-3 py-2"
            value={form.kimlik_tipi}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                kimlik_tipi: e.target.value as (typeof KIMLIK_TIPLERI)[number],
              }))
            }
          >
            {KIMLIK_TIPLERI.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        {(
          [
            ["ad", "Ad"],
            ["soyad", "Soyad"],
            ["yabanci_kimlik_no", "Yabancı kimlik no"],
            ["gecici_protokol_no", "Geçici protokol no"],
            ["email", "E-posta (opsiyonel)"],
            ["sifre", "Şifre (opsiyonel)"],
            ["telefon", "Telefon"],
            ["cinsiyet", "Cinsiyet"],
            ["dogum_tarihi", "Doğum tarihi (YYYY-MM-DD)"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="text-sm">
            {label}
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              required={key === "ad" || key === "soyad"}
            />
          </label>
        ))}
        <Button type="submit" disabled={mut.isPending}>
          Kaydet
        </Button>
        {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
      </form>
    </AppShell>
  );
}
