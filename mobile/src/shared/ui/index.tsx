import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type TextProps,
  type ViewProps,
} from "react-native";
import type { ReactNode } from "react";
import { colors } from "./theme";

export { colors } from "./theme";

export function Title(props: TextProps) {
  return (
    <Text
      {...props}
      style={[{ fontSize: 18, fontWeight: "700", color: colors.text }, props.style]}
    />
  );
}

export function Screen({ style, ...rest }: ViewProps) {
  return <View {...rest} style={[styles.screen, style]} />;
}

export function Center({ style, ...rest }: ViewProps) {
  return <View {...rest} style={[styles.center, style]} />;
}

export function Loading() {
  return (
    <Center>
      <ActivityIndicator color={colors.accent} />
    </Center>
  );
}

export function ErrorText({ children }: { children: string | null }) {
  if (!children) return null;
  return <Text style={styles.error}>{children}</Text>;
}

export function EmptyText({ children }: { children: string }) {
  return <Text style={styles.empty}>{children}</Text>;
}

export function Card({ style, ...rest }: ViewProps) {
  return <View {...rest} style={[styles.card, style]} />;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.section}>{children}</Text>;
}

export function MenuRow({
  title,
  subtitle,
  badge,
  onPress,
}: {
  title: string;
  subtitle?: string;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.menuRow} onPress={onPress}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle ? <Text style={styles.menuSub}>{subtitle}</Text> : null}
      </View>
      {badge && badge > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
        </View>
      ) : (
        <Text style={styles.chevron}>›</Text>
      )}
    </Pressable>
  );
}

export function PrimaryButton({
  label,
  disabled,
  ...rest
}: PressableProps & { label: string }) {
  return (
    <Pressable
      {...rest}
      disabled={disabled}
      style={[styles.primaryBtn, disabled ? { opacity: 0.6 } : null, rest.style as object]}
    >
      <Text style={styles.primaryBtnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
    gap: 4,
  },
  section: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
    marginTop: 8,
    marginBottom: 8,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
    gap: 10,
  },
  menuTitle: { fontWeight: "600", color: colors.text, fontSize: 15 },
  menuSub: { color: colors.muted, fontSize: 12 },
  chevron: { color: colors.muted, fontSize: 22, fontWeight: "300" },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  error: { color: colors.danger, marginBottom: 8 },
  empty: { color: colors.muted, textAlign: "center", marginTop: 24 },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "600" },
});
