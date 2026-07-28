import { Redirect } from "expo-router";
import { useAuthStore } from "@/shared/auth";
import { asHref } from "@/shared/nav";

export default function Index() {
  const token = useAuthStore((s) => s.token);
  if (token) return <Redirect href={asHref("/(hasta)/ozet")} />;
  return <Redirect href="/(auth)/giris" />;
}
