import { DashboardHub } from "@/shared/ui/dashboard";
import type { DashboardTabDef } from "@/shared/ui/dashboard";

type Props = {
  basePath: "/mudur" | "/bashekim";
  tabs: DashboardTabDef[];
};

export function YonetimDashboardLayout({ basePath, tabs }: Props) {
  return <DashboardHub basePath={basePath} tabs={tabs} />;
}
