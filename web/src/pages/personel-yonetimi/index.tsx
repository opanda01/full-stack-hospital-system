import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/shared/ui";
import { api } from "@/shared/api";
import { PersonelEkleForm } from "@/features/personel-ekle";
import type { Personel } from "@/entities/personel";

export function PersonelYonetimiPage() {
  const { data: personeller = [] } = useQuery({
    queryKey: ["personel"],
    queryFn: async () => (await api.get<Personel[]>("/personel/")).data,
  });

  return (
    <AppShell
      title="Personel Yönetimi"
      links={[
        { to: "/admin", label: "Admin" },
        { to: "/kullanicilar", label: "Kullanıcılar" },
      ]}
    >
      <PersonelEkleForm />
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">Sicil</th>
            <th>Kullanıcı ID</th>
            <th>Departman</th>
            <th>Unvan</th>
          </tr>
        </thead>
        <tbody>
          {personeller.map((p) => (
            <tr key={p.id} className="border-b">
              <td className="py-2">{p.sicil_no}</td>
              <td>{p.kullanici_id}</td>
              <td>{p.departman_id ?? "—"}</td>
              <td>{p.unvan ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </AppShell>
  );
}
