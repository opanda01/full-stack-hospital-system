import { Redirect, Tabs } from "expo-router";
import { Platform } from "react-native";
import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/shared/auth";
import { colors } from "@/shared/ui";

type IconName = ComponentProps<typeof Ionicons>["name"];

function tabIcon(name: IconName, focusedName: IconName) {
  return ({
    color,
    size,
    focused,
  }: {
    color: string;
    size: number;
    focused: boolean;
  }) => (
    <Ionicons name={focused ? focusedName : name} size={size} color={color} />
  );
}

export default function HastaLayout() {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Redirect href="/(auth)/giris" />;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700" },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginBottom: Platform.OS === "android" ? 4 : 0,
        },
        tabBarIconStyle: { marginTop: 2 },
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 88 : 64,
          paddingTop: 4,
          paddingBottom: Platform.OS === "ios" ? 24 : 8,
          elevation: 8,
          shadowColor: "#0f172a",
          shadowOpacity: 0.08,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -2 },
        },
      }}
    >
      <Tabs.Screen
        name="ozet/index"
        options={{
          title: "Özet",
          tabBarLabel: "Özet",
          tabBarIcon: tabIcon("home-outline", "home"),
        }}
      />
      <Tabs.Screen
        name="randevularim/index"
        options={{
          title: "Randevu",
          tabBarLabel: "Randevu",
          tabBarIcon: tabIcon("calendar-outline", "calendar"),
        }}
      />
      <Tabs.Screen
        name="randevu-al/index"
        options={{
          title: "Randevu Al",
          tabBarLabel: "Al",
          tabBarIcon: tabIcon("add-circle-outline", "add-circle"),
        }}
      />
      <Tabs.Screen
        name="tetkik-sonuclarim/index"
        options={{
          title: "Tahlil",
          tabBarLabel: "Tahlil",
          tabBarIcon: tabIcon("flask-outline", "flask"),
        }}
      />
      <Tabs.Screen
        name="profil/index"
        options={{
          title: "Profil",
          tabBarLabel: "Profil",
          tabBarIcon: tabIcon("person-outline", "person"),
        }}
      />

      <Tabs.Screen
        name="muayenelerim/index"
        options={{ href: null, title: "Muayenelerim" }}
      />
      <Tabs.Screen
        name="muayenelerim/[id]"
        options={{ href: null, title: "Muayene" }}
      />
      <Tabs.Screen
        name="recetelerim/index"
        options={{ href: null, title: "Reçetelerim" }}
      />
      <Tabs.Screen
        name="tetkik-sonuclarim/[id]"
        options={{ href: null, title: "Tetkik" }}
      />
      <Tabs.Screen
        name="belgelerim/index"
        options={{ href: null, title: "Belgelerim" }}
      />
      <Tabs.Screen
        name="belgelerim/[id]"
        options={{ href: null, title: "Belge" }}
      />
      <Tabs.Screen
        name="sikayet/index"
        options={{ href: null, title: "Şikayet" }}
      />
    </Tabs>
  );
}
