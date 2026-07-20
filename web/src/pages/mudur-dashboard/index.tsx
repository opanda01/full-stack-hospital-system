import { RoleWelcome } from "@/shared/ui";

export function MudurDashboardPage() {
  return (
    <RoleWelcome
      title="Müdür Paneli"
      links={[
        { to: "/departmanlar", label: "Departmanlar" },
        { to: "/personel", label: "Personel" },
        { to: "/sikayet", label: "Şikayetler" },
      ]}
    />
  );
}
