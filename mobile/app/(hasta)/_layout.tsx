import { Redirect, Tabs } from "expo-router";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import type { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/shared/auth";
import { colors, palette, shadows } from "@/shared/ui";

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
    <View style={styles.tabIconWrap}>
      <Ionicons name={focused ? focusedName : name} size={size} color={color} />
      {focused ? <View style={styles.tabDot} /> : <View style={styles.tabDotSpacer} />}
    </View>
  );
}

function RandevuAlTabButton(props: BottomTabBarButtonProps) {
  const { onPress, onLongPress, accessibilityState, accessibilityLabel, testID } =
    props;
  const focused = accessibilityState?.selected;
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityState={accessibilityState}
      accessibilityLabel={accessibilityLabel ?? "Randevu Al"}
      testID={testID}
      style={({ pressed }) => [styles.fabTab, pressed && styles.fabTabPressed]}
    >
      <View style={[styles.fabCircle, focused && styles.fabCircleFocused]}>
        <Ionicons name="add" size={34} color={palette.white} />
      </View>
      <Text style={[styles.fabLabel, focused && styles.fabLabelFocused]}>
        Randevu Al
      </Text>
    </Pressable>
  );
}

export default function HastaLayout() {
  const token = useAuthStore((s) => s.token);
  const rol = useAuthStore((s) => s.rol);
  const hydrated = useAuthStore((s) => s.hydrated);
  if (!hydrated) {
    return null;
  }
  if (!token || rol !== "HASTA") {
    return <Redirect href="/(auth)/giris" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.bosphorus500,
        tabBarInactiveTintColor: palette.slate400,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginBottom: Platform.OS === "android" ? 4 : 0,
        },
        tabBarIconStyle: { marginTop: 2 },
        tabBarStyle: {
          backgroundColor: palette.white,
          borderTopColor: palette.lineSoft,
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 88 : 70,
          paddingTop: 6,
          paddingBottom: Platform.OS === "ios" ? 24 : 10,
          ...shadows.tabBar,
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
          title: "Randevularım",
          tabBarLabel: "Randevu",
          tabBarIcon: tabIcon("calendar-outline", "calendar"),
        }}
      />
      <Tabs.Screen
        name="randevu-al/index"
        options={{
          title: "Randevu Al",
          tabBarLabel: () => null,
          tabBarIcon: () => null,
          tabBarButton: (props) => <RandevuAlTabButton {...props} />,
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
        options={{
          href: null,
          title: "Muayenelerim",
          headerShown: true,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: "#fff",
        }}
      />
      <Tabs.Screen
        name="muayenelerim/[id]"
        options={{
          href: null,
          title: "Muayene",
          headerShown: true,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: "#fff",
        }}
      />
      <Tabs.Screen
        name="recetelerim/index"
        options={{
          href: null,
          title: "Reçetelerim",
          headerShown: true,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: "#fff",
        }}
      />
      <Tabs.Screen
        name="tetkik-sonuclarim/[id]"
        options={{
          href: null,
          title: "Tetkik",
          headerShown: true,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: "#fff",
        }}
      />
      <Tabs.Screen
        name="belgelerim/index"
        options={{
          href: null,
          title: "Belgelerim",
          headerShown: true,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: "#fff",
        }}
      />
      <Tabs.Screen
        name="belgelerim/[id]"
        options={{
          href: null,
          title: "Belge",
          headerShown: true,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: "#fff",
        }}
      />
      <Tabs.Screen
        name="sikayet/index"
        options={{
          href: null,
          title: "Şikayet",
          headerShown: true,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: "#fff",
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconWrap: { alignItems: "center", gap: 2 },
  tabDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.bosphorus500,
  },
  tabDotSpacer: { height: 4 },
  fabTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    top: Platform.OS === "ios" ? -2 : 0,
  },
  fabTabPressed: { opacity: 0.92 },
  fabCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: palette.navy900,
    borderWidth: 4,
    borderColor: palette.white,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -30,
    ...shadows.fab,
  },
  fabCircleFocused: {
    backgroundColor: palette.navy800,
    transform: [{ scale: 1.02 }],
  },
  fabLabel: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: "700",
    color: palette.bosphorus500,
    letterSpacing: 0.1,
  },
  fabLabelFocused: {
    color: palette.bosphorus500,
  },
});
