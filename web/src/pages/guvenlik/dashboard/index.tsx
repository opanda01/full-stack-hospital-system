import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Shield,
} from "lucide-react";
import { RoleDashboard } from "@/shared/ui/RoleDashboard";

export function GuvenlikDashboardPage() {
  return (
    <RoleDashboard
      metrics={[
        { label: "Aktif vardiya", value: 1, icon: Shield },
        { label: "Açık olay", value: 0, icon: AlertTriangle },
        { label: "Bugün çözülen", value: 2, icon: CheckCircle2 },
        { label: "Nöbet saati", value: "08:00", icon: Clock3 },
      ]}
    />
  );
}
