import {
  Building2,
  CalendarClock,
  IdCard,
  Sparkles,
} from "lucide-react";
import { RoleDashboard } from "@/shared/ui/RoleDashboard";

export function MudurDashboardPage() {
  return (
    <RoleDashboard
      metrics={[
        { label: "Personel", value: 412, icon: IdCard },
        { label: "Departman", value: 18, icon: Building2 },
        { label: "Bugünkü randevu", value: 156, icon: CalendarClock },
        { label: "Temizlik görevi", value: 24, icon: Sparkles },
      ]}
    />
  );
}
