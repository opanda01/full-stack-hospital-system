import { RoleWelcome } from "@/shared/ui";

export function HemsireDashboardPage() {
  return (
    <RoleWelcome
      title="Hemşire Paneli"
      links={[
        { to: "/nobet", label: "Nöbet" },
        { to: "/sikayet", label: "Şikayet" },
      ]}
    />
  );
}
