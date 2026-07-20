import { RoleWelcome } from "@/shared/ui";

export function GuvenlikDashboardPage() {
  return (
    <RoleWelcome
      title="Güvenlik Paneli"
      links={[{ to: "/sikayet", label: "Şikayet" }]}
    />
  );
}
