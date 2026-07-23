import { Redirect, Tabs } from "expo-router";
import { useAuthStore } from "@/shared/auth";

export default function HastaLayout() {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Redirect href="/(auth)/giris" />;

  return (
    <Tabs>
      <Tabs.Screen
        name="randevularim/index"
        options={{ title: "Randevularım" }}
      />
      <Tabs.Screen name="randevu-al/index" options={{ title: "Randevu Al" }} />
      <Tabs.Screen
        name="tetkik-sonuclarim/index"
        options={{ title: "Tetkikler" }}
      />
      <Tabs.Screen name="profil/index" options={{ title: "Profil" }} />
    </Tabs>
  );
}
