import { RoleWelcome } from "@/shared/ui";

export function EbeDashboardPage() {
  return (
    <RoleWelcome
      title="Ebe Paneli"
      links={[
        { to: "/nobet", label: "Nöbet" },
        { to: "/sikayet", label: "Şikayet" },
      ]}
    />
  );
}
