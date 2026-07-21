import {
  ClipboardList,
  FileText,
  Users,
  Building2,
} from "lucide-react";
import { RoleDashboard } from "@/shared/ui/RoleDashboard";

export function IdariDashboardPage() {
  return (
    <RoleDashboard
      metrics={[
        { label: "Bugünkü işlem", value: 19, icon: ClipboardList },
        { label: "Bekleyen evrak", value: 7, icon: FileText },
        { label: "Hasta kayıt", value: 11, icon: Users },
        { label: "Departman talebi", value: 4, icon: Building2 },
      ]}
    />
  );
}
