import { RoleWelcome } from "@/shared/ui";

export function LaborantDashboardPage() {
  return (
    <RoleWelcome
      title="Laborant Paneli"
      links={[
        { to: "/laborant/isler", label: "İş listesi" },
        { to: "/sikayet", label: "Şikayet" },
      ]}
    />
  );
}
