/** Expo Metro varsayılanı. Windows'ta "Expo Metro" firewall kuralı genelde 8081'i açar. */
const DEFAULT_METRO_PORT = 8081;

function resolveMetroPort() {
  const fromEnv =
    process.env.METRO_PORT ||
    process.env.RCT_METRO_PORT ||
    process.env.EXPO_METRO_PORT;
  if (fromEnv) {
    const n = Number.parseInt(String(fromEnv), 10);
    if (!Number.isNaN(n) && n > 0) return n;
  }
  return DEFAULT_METRO_PORT;
}

module.exports = { DEFAULT_METRO_PORT, resolveMetroPort };
