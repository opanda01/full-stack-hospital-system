const { spawn } = require("node:child_process");
const path = require("node:path");
const { resolveMetroPort } = require("../metroPort.cjs");
const { pickDevLanHost } = require("../devApiHost.cjs");
const { freeMetroPorts } = require("./free-metro-ports.cjs");
const { ensureWindowsFirewall } = require("./ensure-firewall.cjs");

freeMetroPorts();

const port = resolveMetroPort();
ensureWindowsFirewall(port);

const lanHost = pickDevLanHost();
const extraArgs = process.argv.slice(2);
const expoCli = require.resolve("expo/bin/cli", {
  paths: [path.resolve(__dirname, ".."), path.resolve(__dirname, "../..")],
});

if (lanHost) {
  console.log(`[hbys] LAN: exp://${lanHost}:${port}`);
}

const child = spawn(
  process.execPath,
  [expoCli, "start", "--lan", "--port", String(port), ...extraArgs],
  {
    cwd: path.resolve(__dirname, ".."),
    stdio: "inherit",
    env: {
      ...process.env,
      METRO_PORT: String(port),
      RCT_METRO_PORT: String(port),
      ...(lanHost ? { REACT_NATIVE_PACKAGER_HOSTNAME: lanHost } : {}),
      // Expo API erişimi yoksa doctor/version fetch start'ı düşürüyor (--offline --lan ile çakışır).
      EXPO_OFFLINE: "1",
      EXPO_NO_DEPENDENCY_VALIDATION: "1",
    },
  },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
