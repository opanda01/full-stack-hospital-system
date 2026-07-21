import {
  Building2,
  CalendarClock,
  Stethoscope,
  Users,
} from "lucide-react";
import { RoleDashboard } from "@/shared/ui/RoleDashboard";

export function AdminDashboardPage() {
  return (
    <RoleDashboard
      metrics={[
        { label: "Toplam kullanıcı", value: 248, icon: Users },
        { label: "Aktif doktor", value: 64, icon: Stethoscope },
        { label: "Departman", value: 18, icon: Building2 },
        { label: "Bugünkü randevu", value: 132, icon: CalendarClock },
      ]}
    />
  );
}
