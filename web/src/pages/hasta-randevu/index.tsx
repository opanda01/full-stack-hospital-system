import { AppShell } from "@/shared/ui";
import { RandevuOlusturForm } from "@/features/randevu-olustur";

export function HastaRandevuPage() {
  return (
    <AppShell
      title="Randevu Al"
      links={[{ to: "/hasta", label: "Panelim" }]}
    >
      <RandevuOlusturForm />
    </AppShell>
  );
}
