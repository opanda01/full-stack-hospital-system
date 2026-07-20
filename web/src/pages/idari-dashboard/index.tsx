import { RoleWelcome } from "@/shared/ui";

export function IdariDashboardPage() {
  return (
    <RoleWelcome
      title="İdari Personel Paneli"
      links={[
        { to: "/hasta-kayit", label: "Hasta kayıt" },
        { to: "/sikayet", label: "Şikayet" },
      ]}
    />
  );
}
