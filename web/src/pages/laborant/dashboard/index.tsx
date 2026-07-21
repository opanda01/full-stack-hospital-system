import {
  CheckCircle2,
  ClipboardList,
  FlaskConical,
  Timer,
} from "lucide-react";
import { RoleDashboard } from "@/shared/ui/RoleDashboard";

export function LaborantDashboardPage() {
  return (
    <RoleDashboard
      metrics={[
        { label: "Bekleyen tetkik", value: 22, icon: ClipboardList },
        { label: "Bugün tamamlanan", value: 31, icon: CheckCircle2 },
        { label: "Sonuç girişi", value: 8, icon: FlaskConical },
        { label: "Ortalama süre (dk)", value: 18, icon: Timer },
      ]}
    />
  );
}
