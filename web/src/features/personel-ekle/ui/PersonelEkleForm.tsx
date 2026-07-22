import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Button, SearchableCombobox } from "@/shared/ui";
import { api } from "@/shared/api";
import { getApiErrorMessage } from "@/shared/lib";

type Departman = {
  id: number;
  ad: string;
  birim_ad?: string | null;
};

const PERSONEL_ROLLER = [
  "ADMIN",
  "BASHEKIM",
  "MUDUR",
  "DOKTOR",
  "HEMSIRE",
  "EBE",
  "LABORANT",
  "TEMIZLIK_PERSONELI",
  "GUVENLIK",
  "IDARI_PERSONEL",
];

const emptyForm = {
  tc_kimlik_no: "",
  ad: "",
  soyad: "",
  email: "",
  telefon: "",
  sifre: "Test1234!",
  rol: "HEMSIRE",
  sicil_no: "",
  departman_id: "",
  unvan: "",
  uzmanlik_alani: "",
  diploma_no: "",
  online_randevu_acik_mi: true,
};

export function PersonelEkleForm({ onSuccess }: { onSuccess?: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const { data: departmanlar = [] } = useQuery({
    queryKey: ["departmanlar"],
    queryFn: async () => (await api.get<Departman[]>("/departmanlar/")).data,
  });

  const departmanOptions = useMemo(
    () =>
      departmanlar.map((d) => {
        const label = d.birim_ad ? `${d.birim_ad} — ${d.ad}` : d.ad;
        return {
          value: String(d.id),
          label,
          searchText: `${d.ad} ${d.birim_ad ?? ""}`,
        };
      }),
    [departmanlar],
  );

  const isDoktor = form.rol === "DOKTOR";

  const createMut = useMutation({
    mutationFn: async () =>
      api.post("/personel/with-user", {
        tc_kimlik_no: form.tc_kimlik_no,
        ad: form.ad,
        soyad: form.soyad,
        email: form.email,
        telefon: form.telefon || null,
        sifre: form.sifre,
        rol: form.rol,
        sicil_no: form.sicil_no,
        departman_id: form.departman_id ? Number(form.departman_id) : null,
        unvan: form.unvan || null,
        uzmanlik_alani: isDoktor ? form.uzmanlik_alani : null,
        diploma_no: isDoktor ? form.diploma_no : null,
        online_randevu_acik_mi: isDoktor ? form.online_randevu_acik_mi : true,
      }),
    onSuccess: () => {
      setError(null);
      setForm(emptyForm);
      qc.invalidateQueries({ queryKey: ["personel"] });
      qc.invalidateQueries({ queryKey: ["kullanicilar"] });
      qc.invalidateQueries({ queryKey: ["doktorlar"] });
      qc.invalidateQueries({ queryKey: ["erisim-talepleri"] });
      qc.invalidateQueries({ queryKey: ["bashekim-ozet"] });
      onSuccess?.();
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  return (
    <form
      className="mb-6 grid max-w-2xl gap-2 rounded border bg-card p-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        createMut.mutate();
      }}
    >
      <p className="sm:col-span-2 text-sm text-muted-foreground">
        Yeni personel Başhekim erişim onayına düşer; onaylanana kadar giriş yapamaz.
      </p>
      <p className="sm:col-span-2 text-sm text-muted-foreground">
        Tek formda hesap + personel kaydı oluşturulur. Doktor seçilirse uzmanlık
        bilgileri de kaydedilir.
      </p>
      <input
        className="rounded border px-3 py-2"
        placeholder="Ad"
        value={form.ad}
        onChange={(e) => setForm({ ...form, ad: e.target.value })}
        required
      />
      <input
        className="rounded border px-3 py-2"
        placeholder="Soyad"
        value={form.soyad}
        onChange={(e) => setForm({ ...form, soyad: e.target.value })}
        required
      />
      <input
        className="rounded border px-3 py-2"
        placeholder="TC"
        value={form.tc_kimlik_no}
        onChange={(e) => setForm({ ...form, tc_kimlik_no: e.target.value })}
        required
      />
      <input
        className="rounded border px-3 py-2"
        placeholder="E-posta"
        type="email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        required
      />
      <input
        className="rounded border px-3 py-2"
        placeholder="Telefon (opsiyonel)"
        value={form.telefon}
        onChange={(e) => setForm({ ...form, telefon: e.target.value })}
      />
      <select
        className="rounded border px-3 py-2"
        value={form.rol}
        onChange={(e) => setForm({ ...form, rol: e.target.value })}
      >
        {PERSONEL_ROLLER.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <input
        className="rounded border px-3 py-2"
        placeholder="Sicil no"
        value={form.sicil_no}
        onChange={(e) => setForm({ ...form, sicil_no: e.target.value })}
        required
      />
      <SearchableCombobox
        options={departmanOptions}
        value={form.departman_id}
        onChange={(departman_id) => setForm({ ...form, departman_id })}
        placeholder="Departman ara ve seç…"
        emptyLabel="Eşleşen departman yok"
      />
      <input
        className="rounded border px-3 py-2 sm:col-span-2"
        placeholder="Unvan (opsiyonel)"
        value={form.unvan}
        onChange={(e) => setForm({ ...form, unvan: e.target.value })}
      />

      {isDoktor && (
        <>
          <input
            className="rounded border px-3 py-2"
            placeholder="Uzmanlık alanı"
            value={form.uzmanlik_alani}
            onChange={(e) =>
              setForm({ ...form, uzmanlik_alani: e.target.value })
            }
            required
          />
          <input
            className="rounded border px-3 py-2"
            placeholder="Diploma no"
            value={form.diploma_no}
            onChange={(e) => setForm({ ...form, diploma_no: e.target.value })}
            required
          />
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={form.online_randevu_acik_mi}
              onChange={(e) =>
                setForm({ ...form, online_randevu_acik_mi: e.target.checked })
              }
            />
            Online randevu açık
          </label>
        </>
      )}

      <Button type="submit" disabled={createMut.isPending}>
        Personel ekle
      </Button>
      {error && (
        <p className="text-sm text-red-600 sm:col-span-2" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
