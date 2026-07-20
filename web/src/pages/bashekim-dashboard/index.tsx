import { RoleWelcome } from "@/shared/ui";

export function BashekimDashboardPage() {
  return (
    <RoleWelcome
      title="Başhekim Paneli"
      links={[
        { to: "/departmanlar", label: "Departmanlar" },
        { to: "/personel", label: "Personel" },
        { to: "/temizlik-ata", label: "Temizlik ata" },
        { to: "/sikayet", label: "Şikayetler" },
      ]}
    />
  );
}
