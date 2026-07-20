import { RoleWelcome } from "@/shared/ui";

export function DoktorDashboardPage() {
  return (
    <RoleWelcome
      title="Doktor Paneli"
      links={[
        { to: "/doktor/randevularim", label: "Randevularım" },
        { to: "/doktor/muayene", label: "Muayene" },
        { to: "/doktor/profil", label: "Profil" },
        { to: "/sikayet", label: "Şikayet" },
      ]}
    />
  );
}
