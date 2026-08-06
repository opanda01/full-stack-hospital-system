import { useEffect, useRef } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { palette, radius, spacing } from "./theme";
import { Screen } from "./components";

function useSkeletonPulse() {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 650,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return opacity;
}

export function SkeletonBox({
  width,
  height,
  style,
  borderRadius = radius.md,
}: {
  width?: number | `${number}%`;
  height: number;
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
}) {
  const opacity = useSkeletonPulse();
  return (
    <Animated.View
      style={[
        styles.bone,
        { width: width ?? "100%", height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

function PageHeroSkeleton() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.pageHero, { paddingTop: insets.top + spacing.lg }]}>
      <SkeletonBox width="55%" height={22} />
      <SkeletonBox
        width="78%"
        height={14}
        style={{ marginTop: spacing.sm }}
      />
    </View>
  );
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <View style={styles.card}>
      <SkeletonBox width="40%" height={12} />
      <SkeletonBox width="92%" height={16} style={{ marginTop: spacing.sm }} />
      {lines >= 3 ? (
        <SkeletonBox width="70%" height={14} style={{ marginTop: spacing.sm }} />
      ) : null}
    </View>
  );
}

export function ListCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.listGap}>
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} lines={i % 2 === 0 ? 3 : 2} />
      ))}
    </View>
  );
}

export function OzetScreenSkeleton() {
  const insets = useSafeAreaInsets();
  return (
    <Screen bleed style={{ paddingBottom: spacing.xl }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <View style={[styles.hero, { paddingTop: insets.top + spacing.lg }]}>
          <SkeletonBox width="38%" height={12} borderRadius={radius.pill} />
          <SkeletonBox
            width="72%"
            height={26}
            style={{ marginTop: spacing.sm }}
          />
        </View>
        <View style={styles.bodyPad}>
          <CardSkeleton lines={4} />
          <View style={{ marginTop: spacing.lg }}>
            <SkeletonBox width="36%" height={14} />
            <View style={{ marginTop: spacing.sm }}>
              <CardSkeleton lines={2} />
            </View>
          </View>
          <SkeletonBox
            width="44%"
            height={14}
            style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}
          />
          <View style={styles.quickGrid}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={styles.quickTile}>
                <SkeletonBox width={28} height={28} borderRadius={8} />
                <SkeletonBox
                  width="80%"
                  height={12}
                  style={{ marginTop: spacing.sm }}
                />
                <SkeletonBox
                  width="60%"
                  height={10}
                  style={{ marginTop: 4 }}
                />
              </View>
            ))}
          </View>
          <SkeletonBox
            width="50%"
            height={14}
            style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}
          />
          <ListCardsSkeleton count={3} />
        </View>
      </ScrollView>
    </Screen>
  );
}

export function RandevuScreenSkeleton() {
  return (
    <Screen bleed>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.xl,
        }}
      >
        <PageHeroSkeleton />
        <SkeletonBox
          height={40}
          borderRadius={radius.lg}
          style={{ marginTop: spacing.md }}
        />
        <View style={[styles.calendarBlock, { marginTop: spacing.md }]}>
          <SkeletonBox width="50%" height={16} />
          <View style={styles.calendarGrid}>
            {Array.from({ length: 12 }, (_, i) => (
              <SkeletonBox key={i} height={36} borderRadius={10} />
            ))}
          </View>
        </View>
        <ListCardsSkeleton count={3} />
      </ScrollView>
    </Screen>
  );
}

export function TetkikScreenSkeleton() {
  return (
    <Screen bleed>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.xl,
        }}
      >
        <PageHeroSkeleton />
        <ListCardsSkeleton count={4} />
      </ScrollView>
    </Screen>
  );
}

export function ProfilScreenSkeleton() {
  const insets = useSafeAreaInsets();
  return (
    <Screen bleed>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={[styles.profilHero, { paddingTop: insets.top + spacing.lg }]}>
          <SkeletonBox width={64} height={64} borderRadius={20} />
          <SkeletonBox
            width="55%"
            height={22}
            style={{ marginTop: spacing.sm }}
          />
          <SkeletonBox
            width="70%"
            height={13}
            style={{ marginTop: spacing.xs }}
          />
          <SkeletonBox
            width={100}
            height={24}
            borderRadius={radius.pill}
            style={{ marginTop: spacing.sm }}
          />
        </View>
        <View style={styles.bodyPad}>
          <SkeletonBox width="30%" height={14} style={{ marginBottom: spacing.sm }} />
          <CardSkeleton lines={2} />
          <SkeletonBox
            width="40%"
            height={14}
            style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}
          />
          <CardSkeleton lines={4} />
          <SkeletonBox
            width="32%"
            height={14}
            style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}
          />
          <CardSkeleton lines={3} />
        </View>
      </ScrollView>
    </Screen>
  );
}

export function SimpleListScreenSkeleton({ withHero = true }: { withHero?: boolean }) {
  return (
    <Screen bleed={withHero}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: withHero ? spacing.lg : 0,
          paddingBottom: spacing.xl,
        }}
      >
        {withHero ? <PageHeroSkeleton /> : null}
        <View style={withHero ? undefined : { paddingHorizontal: spacing.lg }}>
          <ListCardsSkeleton count={5} />
        </View>
      </ScrollView>
    </Screen>
  );
}

export function RandevuAlScreenSkeleton() {
  return (
    <Screen bleed>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.xl,
        }}
      >
        <PageHeroSkeleton />
        <SkeletonBox
          height={44}
          borderRadius={radius.md}
          style={{ marginTop: spacing.md }}
        />
        <ListCardsSkeleton count={6} />
      </ScrollView>
    </Screen>
  );
}

export function DetailScreenSkeleton() {
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        <SkeletonBox width="45%" height={18} />
        <CardSkeleton lines={4} />
        <SkeletonBox width="35%" height={16} />
        <CardSkeleton lines={3} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  bone: {
    backgroundColor: palette.lineSoft,
  },
  hero: {
    backgroundColor: palette.navy900,
    paddingHorizontal: spacing.lg + 4,
    paddingBottom: spacing.xl + 4,
    overflow: "hidden",
  },
  pageHero: {
    backgroundColor: palette.navy900,
    paddingHorizontal: spacing.lg + 4,
    paddingBottom: spacing.lg,
    marginHorizontal: -spacing.lg,
    marginBottom: spacing.md,
  },
  profilHero: {
    backgroundColor: palette.navy900,
    paddingHorizontal: spacing.lg + 4,
    paddingBottom: spacing.xl,
    alignItems: "flex-start",
  },
  bodyPad: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  card: {
    backgroundColor: palette.white,
    borderRadius: radius.xl,
    padding: spacing.md + 2,
    borderWidth: 1,
    borderColor: palette.lineSoft,
    marginBottom: spacing.sm + 2,
  },
  listGap: {
    gap: spacing.sm + 2,
    marginTop: spacing.sm,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm + 2,
  },
  quickTile: {
    width: "47%",
    backgroundColor: palette.sand100,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: palette.lineSoft,
  },
  calendarBlock: {
    backgroundColor: palette.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: palette.lineSoft,
    marginBottom: spacing.md,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
