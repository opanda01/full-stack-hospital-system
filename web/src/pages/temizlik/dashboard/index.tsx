import {
  CheckCircle2,
  ClipboardList,
  Clock3,
  Sparkles,
} from "lucide-react";
import { RoleDashboard } from "@/shared/ui/RoleDashboard";

export function TemizlikDashboardPage() {
  return (
    <RoleDashboard
      metrics={[
        { label: "Aktif görev", value: 5, icon: Sparkles },
        { label: "Bekleyen", value: 3, icon: ClipboardList },
        { label: "Tamamlanan", value: 12, icon: CheckCircle2 },
        { label: "Ortalama süre (dk)", value: 25, icon: Clock3 },
      ]}
    />
  );
}
