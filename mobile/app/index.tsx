import { Redirect } from "expo-router";
import { useAuthStore } from "@/shared/auth";

export default function Index() {
  const token = useAuthStore((s) => s.token);
  if (token) return <Redirect href="/(hasta)/randevularim" />;
  return <Redirect href="/(auth)/giris" />;
}
