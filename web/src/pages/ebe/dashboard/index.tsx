import {
  CalendarClock,
  CalendarDays,
  ClipboardList,
  Users,
} from "lucide-react";
import { RoleDashboard } from "@/shared/ui/RoleDashboard";

export function EbeDashboardPage() {
  return (
    <RoleDashboard
      metrics={[
        { label: "Departman randevusu", value: 16, icon: CalendarClock },
        { label: "Bu haftaki nöbet", value: 2, icon: CalendarDays },
        { label: "Bekleyen işlem", value: 4, icon: ClipboardList },
        { label: "Takipteki hasta", value: 11, icon: Users },
      ]}
    />
  );
}
