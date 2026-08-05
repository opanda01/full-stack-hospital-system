const DEPT_COLORS = [
  "#EF4444",
  "#F97316",
  "#8B5CF6",
  "#0D3B6E",
  "#06B6D4",
  "#10B981",
  "#6366F1",
  "#EC4899",
] as const;

export function departmanGorsel(ad: string): { color: string; abbr: string } {
  let hash = 0;
  for (let i = 0; i < ad.length; i++) {
    hash = ad.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = DEPT_COLORS[Math.abs(hash) % DEPT_COLORS.length];
  const words = ad.split(/\s+/).filter(Boolean);
  let abbr: string;
  if (words.length >= 2) {
    abbr = (words[0].slice(0, 1) + words[1].slice(0, 2)).toLocaleUpperCase("tr-TR");
  } else {
    abbr = ad.slice(0, 3).toLocaleUpperCase("tr-TR");
  }
  return { color, abbr: abbr.slice(0, 3) };
}
