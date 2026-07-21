import {
  Building2,
  CalendarClock,
  IdCard,
  MessageSquareWarning,
} from "lucide-react";
import { RoleDashboard } from "@/shared/ui/RoleDashboard";

export function BashekimDashboardPage() {
  return (
    <RoleDashboard
      metrics={[
        { label: "Personel", value: 412, icon: IdCard },
        { label: "Departman", value: 18, icon: Building2 },
        { label: "Bugünkü randevu", value: 156, icon: CalendarClock },
        { label: "Açık şikayet", value: 9, icon: MessageSquareWarning },
      ]}
    />
  );
}
