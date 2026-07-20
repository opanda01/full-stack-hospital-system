import { RoleWelcome } from "@/shared/ui";

export function TemizlikDashboardPage() {
  return (
    <RoleWelcome
      title="Temizlik Paneli"
      links={[
        { to: "/temizlik/gorevler", label: "Görevlerim" },
        { to: "/sikayet", label: "Şikayet" },
      ]}
    />
  );
}
