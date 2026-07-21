import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Users,
} from "lucide-react";
import { RoleDashboard } from "@/shared/ui/RoleDashboard";

export function DoktorDashboardPage() {
  return (
    <RoleDashboard
      metrics={[
        { label: "Bugünkü randevu", value: 12, icon: CalendarClock },
        { label: "Bekleyen muayene", value: 5, icon: ClipboardList },
        { label: "Tamamlanan", value: 7, icon: CheckCircle2 },
        { label: "Hastalarım", value: 86, icon: Users },
      ]}
    />
  );
}
