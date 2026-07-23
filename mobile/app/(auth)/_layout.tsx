import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "@/shared/auth";

export default function AuthLayout() {
  const token = useAuthStore((s) => s.token);
  if (token) return <Redirect href="/(hasta)/randevularim" />;

  return (
    <Stack>
      <Stack.Screen name="giris" options={{ title: "Giriş" }} />
      <Stack.Screen name="kayit" options={{ title: "Kayıt" }} />
    </Stack>
  );
}
