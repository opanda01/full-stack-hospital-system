import { Platform, type TextStyle, type ViewStyle } from "react-native";

/** Figma hasta mobil — lacivert / gökyüzü mavisi paleti */
export const palette = {
  navy900: "#0D3B6E",
  navy800: "#0D3B6E",
  bosphorus500: "#1D6FA4",
  bosphorus400: "#2A8EC4",
  bosphorus200: "#BAE6FD",
  bosphorus50: "#EFF8FF",
  poppy600: "#DC2626",
  poppy100: "#FEF2F2",
  sand100: "#F8FAFC",
  sand50: "#F0F4F8",
  line: "#E2E8F0",
  lineSoft: "#F1F5F9",
  white: "#ffffff",
  ink: "#0D1B2A",
  slate900: "#0D1B2A",
  slate600: "#64748B",
  slate400: "#94A3B8",
  green700: "#16A34A",
  green100: "#F0FDF4",
  amber700: "#EA580C",
  amber100: "#FFF7ED",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 18,
  pill: 999,
} as const;

export const shadows = {
  card: {
    shadowColor: "#0D3B6E",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardSoft: {
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  fab: {
    shadowColor: "#0D3B6E",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  tabBar: {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
} satisfies Record<string, ViewStyle>;

const monoFamily = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});

export const typography = {
  eyebrow: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  } satisfies TextStyle,
  titleLg: {
    fontSize: 22,
    fontWeight: "800",
    color: palette.ink,
  } satisfies TextStyle,
  titleMd: {
    fontSize: 18,
    fontWeight: "700",
    color: palette.ink,
  } satisfies TextStyle,
  body: {
    fontSize: 15,
    fontWeight: "400",
    color: palette.ink,
    lineHeight: 22,
  } satisfies TextStyle,
  bodySm: {
    fontSize: 13,
    fontWeight: "400",
    color: palette.slate600,
    lineHeight: 18,
  } satisfies TextStyle,
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: palette.slate400,
  } satisfies TextStyle,
  section: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: palette.slate400,
  } satisfies TextStyle,
  dataMd: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: monoFamily,
    color: palette.ink,
    letterSpacing: 0.5,
  } satisfies TextStyle,
  dataLg: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: monoFamily,
    color: palette.ink,
    letterSpacing: 0.3,
  } satisfies TextStyle,
} as const;

/** Geriye dönük uyumluluk */
export const colors = {
  bg: palette.sand50,
  surface: palette.white,
  border: palette.lineSoft,
  primary: palette.navy900,
  primarySoft: palette.bosphorus50,
  accent: palette.bosphorus500,
  text: palette.ink,
  muted: palette.slate600,
  danger: palette.poppy600,
  success: palette.green700,
  chip: palette.sand100,
  poppy: palette.poppy600,
  sand: palette.sand100,
  line: palette.line,
};
