/** @deprecated Use YonetimDashboardOzetTab with root prop */
import { YonetimDashboardOzetTab } from "./tabs/OzetTab";

type Props = { root: "/bashekim" | "/mudur" };

export function YonetimDashboardPage({ root }: Props) {
  return <YonetimDashboardOzetTab root={root} />;
}

export { YonetimDashboardLayout } from "./YonetimDashboardLayout";
export { YonetimDashboardOzetTab } from "./tabs/OzetTab";
export { YonetimDashboardBekleyenlerTab } from "./tabs/BekleyenlerTab";
export { YonetimDashboardOperasyonTab } from "./tabs/OperasyonTab";
