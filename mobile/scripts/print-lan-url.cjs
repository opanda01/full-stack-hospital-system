const { listDevLanHosts, pickDevLanHost } = require("../devApiHost.cjs");
const { PREFIX } = require("../metroApiProxy.cjs");
const { resolveMetroPort } = require("../metroPort.cjs");

const chosen = pickDevLanHost();
const rows = listDevLanHosts();
const metroPort = resolveMetroPort();

console.log("");
console.log("Telefonda tarayıcıda deneyin (Metro + Docker ayaktayken):");
if (chosen) {
  console.log(
    `  http://${chosen}:${metroPort}${PREFIX}/health   ← önerilen (proxy)`,
  );
  console.log(
    `  http://${chosen}:8000/health   (doğrudan; güvenlik duvarı engelleyebilir)`,
  );
  console.log("");
  console.log(`Expo Go: exp://${chosen}:${metroPort}`);
}
console.log("");
console.log("Tüm IPv4 adresleri:");
for (const row of rows) {
  const mark = row.ip === chosen ? "  ← Wi‑Fi" : "";
  console.log(`  ${row.ip.padEnd(16)} ${row.name}${mark}`);
}
console.log("");
console.log(
  `Mobil uygulama varsayılan olarak Metro proxy kullanır (${metroPort}/hbys-api).`,
);
console.log("Başlatma: pnpm --filter mobile dev  (LAN + port 8081)");
console.log("Port meşgulse: pnpm --filter mobile dev:free");
console.log(
  "Telefonda loading donuyorsa: Windows Güvenlik Duvarı'nda TCP 8081 Allow (Expo Metro) ve aynı ağ/hotspot.",
);
console.log("Doğrudan 8000 için: EXPO_PUBLIC_API_DIRECT=1");
console.log("");
