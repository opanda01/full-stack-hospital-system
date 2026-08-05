import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type TextProps,
  type ViewProps,
  type ViewStyle,
} from "react-native";
import type { TextStyle } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { colors, palette, radius, shadows, spacing, typography } from "./theme";

export function BogazDivider() {
  return (
    <View style={styles.bogazWrap} accessibilityRole="none">
      <View style={[styles.bogazSeg, { flex: 1, backgroundColor: palette.bosphorus500 }]} />
      <View style={[styles.bogazSeg, { width: 28, backgroundColor: palette.poppy600 }]} />
      <View style={[styles.bogazSeg, { flex: 1, backgroundColor: palette.navy900 }]} />
    </View>
  );
}

export function ScreenHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.screenHeader}>
      <Text style={typography.titleMd}>{title}</Text>
      {subtitle ? <Text style={[typography.bodySm, { marginTop: spacing.xs }]}>{subtitle}</Text> : null}
    </View>
  );
}

/** Figma tarzı üst başlık bandı (gradient yerine katmanlı lacivert) */
export function PageHero({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <View style={styles.pageHero}>
      <View style={styles.pageHeroOrbLg} />
      <View style={styles.pageHeroOrbSm} />
      <Text style={styles.pageHeroTitle}>{title}</Text>
      {subtitle ? <Text style={styles.pageHeroSub}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

export function QuickActionTile({
  label,
  sub,
  bg,
  accent,
  icon: Icon,
  onPress,
}: {
  label: string;
  sub: string;
  bg: string;
  accent: string;
  icon: LucideIcon;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.quickTile, { backgroundColor: bg, borderColor: `${accent}18` }]}
      accessibilityRole="button"
    >
      <Icon size={22} color={accent} strokeWidth={2} />
      <Text style={styles.quickTileLabel}>{label}</Text>
      <Text style={styles.quickTileSub}>{sub}</Text>
    </Pressable>
  );
}

export function SectionHeader({
  title,
  icon: Icon,
}: {
  title: string;
  icon: LucideIcon;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Icon size={18} color={palette.navy800} strokeWidth={2.25} />
      <Text style={[typography.section, styles.sectionHeaderText]}>{title}</Text>
    </View>
  );
}

export type CardStatus = "normal" | "critical" | "pending";

export function Card({
  style,
  status = "normal",
  variant = "default",
  ...rest
}: ViewProps & { status?: CardStatus; variant?: "default" | "navy" }) {
  return (
    <View
      {...rest}
      style={[
        styles.card,
        status === "critical" && styles.cardCritical,
        status === "pending" && styles.cardPending,
        variant === "navy" && styles.cardNavy,
        style,
      ]}
    />
  );
}

export type BadgeKind = "success" | "warning" | "neutral" | "danger";

export function Badge({
  label,
  kind = "neutral",
}: {
  label: string;
  kind?: BadgeKind;
}) {
  const wrap = badgeWrap[kind];
  const text = badgeTextStyle[kind];
  return (
    <View style={[styles.badge, wrap]}>
      <Text style={[styles.badgeText, text]}>{label}</Text>
    </View>
  );
}

const badgeWrap: Record<BadgeKind, ViewStyle> = {
  success: { backgroundColor: palette.green100 },
  warning: { backgroundColor: palette.amber100 },
  neutral: { backgroundColor: palette.sand100 },
  danger: { backgroundColor: palette.poppy100 },
};

const badgeTextStyle: Record<BadgeKind, TextStyle> = {
  success: { color: palette.green700 },
  warning: { color: palette.amber700 },
  neutral: { color: palette.slate600 },
  danger: { color: palette.poppy600 },
};

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

export function EmptyState({
  title,
  description,
  tone = "neutral",
  icon: Icon,
  actionLabel,
  onAction,
}: {
  title: string;
  description?: string;
  tone?: "neutral" | "error";
  icon: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const iconColor = tone === "error" ? palette.poppy600 : palette.navy800;
  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIconWrap, tone === "error" && styles.emptyIconError]}>
        <Icon size={28} color={iconColor} strokeWidth={2} />
      </View>
      <Text style={typography.titleMd}>{title}</Text>
      {description ? (
        <Text style={[typography.bodySm, styles.emptyDesc]}>{description}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <Pressable style={styles.emptyAction} onPress={onAction}>
          <Text style={styles.emptyActionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export type SegmentItem<T extends string> = {
  key: T;
  label: string;
  count?: number;
};

export function SegmentControl<T extends string>({
  segments,
  value,
  onChange,
}: {
  segments: SegmentItem<T>[];
  value: T;
  onChange: (key: T) => void;
}) {
  return (
    <View style={styles.segment}>
      {segments.map((seg) => {
        const on = value === seg.key;
        return (
          <Pressable
            key={seg.key}
            style={[styles.segmentItem, on && styles.segmentItemOn]}
            onPress={() => onChange(seg.key)}
          >
            <Text style={[styles.segmentLabel, on && styles.segmentLabelOn]}>{seg.label}</Text>
            {seg.count != null ? (
              <View style={[styles.segmentCount, on && styles.segmentCountOn]}>
                <Text style={[styles.segmentCountText, on && styles.segmentCountTextOn]}>
                  {seg.count}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export function Title(props: TextProps) {
  return <Text {...props} style={[typography.titleMd, props.style]} />;
}

export function Screen({
  style,
  bleed,
  ...rest
}: ViewProps & { bleed?: boolean }) {
  return (
    <View
      {...rest}
      style={[styles.screen, bleed && styles.screenBleed, style]}
    />
  );
}

export function Center({ style, ...rest }: ViewProps) {
  return <View {...rest} style={[styles.center, style]} />;
}

export function Loading() {
  return (
    <Center>
      <ActivityIndicator color={palette.bosphorus500} />
    </Center>
  );
}

export function ErrorText({ children }: { children: string | null }) {
  if (!children) return null;
  return <Text style={styles.error}>{children}</Text>;
}

export function EmptyText({ children }: { children: string }) {
  return <Text style={styles.emptyLegacy}>{children}</Text>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={[typography.section, styles.sectionTitle]}>{children}</Text>;
}

export function MenuRow({
  title,
  subtitle,
  badge,
  icon: Icon,
  onPress,
}: {
  title: string;
  subtitle?: string;
  badge?: number;
  icon?: LucideIcon;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.menuRow} onPress={onPress}>
      {Icon ? (
        <View style={styles.menuIcon}>
          <Icon size={20} color={palette.navy800} strokeWidth={2} />
        </View>
      ) : null}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle ? <Text style={styles.menuSub}>{subtitle}</Text> : null}
      </View>
      {badge && badge > 0 ? (
        <View style={styles.menuBadge}>
          <Text style={styles.menuBadgeText}>{badge > 99 ? "99+" : badge}</Text>
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
      style={[
        styles.primaryBtn,
        disabled ? styles.primaryBtnDisabled : null,
        rest.style as object,
      ]}
    >
      <Text style={styles.primaryBtnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bogazWrap: {
    flexDirection: "row",
    height: 3,
    borderRadius: radius.pill,
    overflow: "hidden",
    marginTop: spacing.sm,
  },
  bogazSeg: { height: "100%" },
  screenHeader: { marginBottom: spacing.lg },
  pageHero: {
    backgroundColor: palette.navy900,
    paddingHorizontal: spacing.lg + 4,
    paddingTop: spacing.xxl + 12,
    paddingBottom: spacing.xl,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  pageHeroOrbLg: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  pageHeroOrbSm: {
    position: "absolute",
    top: 20,
    right: 60,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  pageHeroTitle: {
    color: palette.white,
    fontSize: 22,
    fontWeight: "800",
  },
  pageHeroSub: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    marginTop: spacing.xs,
  },
  quickTile: {
    flex: 1,
    minWidth: "46%",
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md + 2,
    gap: spacing.sm,
  },
  quickTileLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: palette.ink,
  },
  quickTileSub: {
    fontSize: 11,
    color: palette.slate400,
    marginTop: -4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionHeaderText: { marginTop: 0, marginBottom: 0 },
  sectionTitle: { marginTop: spacing.md, marginBottom: spacing.sm },
  screen: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  screenBleed: { paddingHorizontal: 0, paddingTop: 0 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm + 2,
    gap: spacing.xs,
    ...shadows.cardSoft,
  },
  cardCritical: {
    borderColor: palette.poppy600,
    backgroundColor: palette.poppy100,
  },
  cardPending: {
    borderColor: palette.amber700,
    backgroundColor: palette.amber100,
  },
  cardNavy: {
    backgroundColor: palette.navy900,
    borderColor: palette.navy900,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  badgeText: { fontSize: 12, fontWeight: "700" },
  chip: {
    borderWidth: 0,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: palette.sand50,
  },
  chipSelected: {
    backgroundColor: palette.navy900,
  },
  chipLabel: { ...typography.bodySm, fontWeight: "600", color: colors.text },
  chipLabelSelected: { color: palette.white },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: palette.bosphorus50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  emptyIconError: { backgroundColor: palette.poppy100 },
  emptyDesc: { textAlign: "center" },
  emptyAction: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    backgroundColor: palette.navy900,
  },
  emptyActionText: { color: palette.white, fontWeight: "600", fontSize: 15 },
  segment: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.md + 2,
    borderWidth: 0,
    padding: spacing.xs,
    marginBottom: spacing.md,
    gap: spacing.xs,
    ...shadows.cardSoft,
  },
  segmentItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs + 2,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.sm + 1,
  },
  segmentItemOn: { backgroundColor: palette.navy900 },
  segmentLabel: { fontSize: 14, fontWeight: "700", color: colors.muted },
  segmentLabelOn: { color: palette.white },
  segmentCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.chip,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  segmentCountOn: { backgroundColor: "rgba(255,255,255,0.22)" },
  segmentCountText: { fontSize: 11, fontWeight: "700", color: colors.muted },
  segmentCountTextOn: { color: palette.white },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.md + 2,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    gap: spacing.sm + 2,
    ...shadows.cardSoft,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: palette.bosphorus50,
    alignItems: "center",
    justifyContent: "center",
  },
  menuTitle: { fontWeight: "600", color: colors.text, fontSize: 15 },
  menuSub: { color: colors.muted, fontSize: 12 },
  chevron: { color: colors.muted, fontSize: 22, fontWeight: "300" },
  menuBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: palette.poppy600,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  menuBadgeText: { color: palette.white, fontSize: 11, fontWeight: "700" },
  error: { color: colors.danger, marginBottom: spacing.sm },
  emptyLegacy: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  primaryBtn: {
    backgroundColor: palette.navy900,
    borderRadius: radius.md + 2,
    paddingVertical: spacing.md + 2,
    alignItems: "center",
    ...shadows.card,
  },
  primaryBtnDisabled: { opacity: 0.55 },
  primaryBtnText: { color: palette.white, fontWeight: "600", fontSize: 15 },
});
