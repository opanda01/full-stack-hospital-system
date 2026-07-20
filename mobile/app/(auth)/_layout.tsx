import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="giris" options={{ title: "Giriş" }} />
      <Stack.Screen name="kayit" options={{ title: "Kayıt" }} />
    </Stack>
  );
}
