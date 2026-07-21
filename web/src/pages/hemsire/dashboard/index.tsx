import {
  CalendarClock,
  CalendarDays,
  ClipboardList,
  Users,
} from "lucide-react";
import { RoleDashboard } from "@/shared/ui/RoleDashboard";

export function HemsireDashboardPage() {
  return (
    <RoleDashboard
      metrics={[
        { label: "Departman randevusu", value: 28, icon: CalendarClock },
        { label: "Bu haftaki nöbet", value: 3, icon: CalendarDays },
        { label: "Bekleyen işlem", value: 6, icon: ClipboardList },
        { label: "Yatan hasta", value: 14, icon: Users },
      ]}
    />
  );
}
