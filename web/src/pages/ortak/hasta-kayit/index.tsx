import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell, Button } from "@/shared/ui";
import { api } from "@/shared/api";

export function HastaKayitPage() {
  const [form, setForm] = useState({
    tc_kimlik_no: "",
    ad: "",
    soyad: "",
    email: "",
    sifre: "Test1234!",
    telefon: "",
  });
  const [msg, setMsg] = useState<string | null>(null);
  const mut = useMutation({
    mutationFn: async () => api.post("/hastalar/", form),
    onSuccess: () => setMsg("Hasta kaydı oluşturuldu"),
    onError: () => setMsg("Kayıt başarısız"),
  });

  return (
    <AppShell title="Hasta Kayıt" links={[{ to: "/admin", label: "Admin" }]}>
      <form
        className="grid max-w-md gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          mut.mutate();
        }}
      >
        {(
          [
            ["tc_kimlik_no", "TC"],
            ["ad", "Ad"],
            ["soyad", "Soyad"],
            ["email", "E-posta"],
            ["sifre", "Şifre"],
            ["telefon", "Telefon"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="text-sm">
            {label}
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              required={key !== "telefon"}
            />
          </label>
        ))}
        <Button type="submit">Kaydet</Button>
        {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
      </form>
    </AppShell>
  );
}
