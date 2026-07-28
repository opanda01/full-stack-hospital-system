/**
 * Hedef Metro portunu dinleyen node süreçlerini kapatır (Windows + *nix).
 * Böylece dünden kalan Expo/Metro 8081/8082 karmaşası tekrarlanmaz.
 */
const { execSync } = require("node:child_process");
const { resolveMetroPort } = require("../metroPort.cjs");

function unique(nums) {
  return [...new Set(nums.filter((n) => Number.isFinite(n) && n > 0))];
}

function pidsListeningOnPortWindows(port) {
  try {
    const out = execSync(
      `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess"`,
      { encoding: "utf8" },
    );
    return unique(
      out
        .split(/\r?\n/)
        .map((s) => Number.parseInt(s.trim(), 10))
        .filter((n) => !Number.isNaN(n)),
    );
  } catch {
    return [];
  }
}

function pidsListeningOnPortUnix(port) {
  try {
    const out = execSync(`lsof -tiTCP:${port} -sTCP:LISTEN`, {
      encoding: "utf8",
    });
    return unique(
      out
        .split(/\r?\n/)
        .map((s) => Number.parseInt(s.trim(), 10))
        .filter((n) => !Number.isNaN(n)),
    );
  } catch {
    return [];
  }
}

function freePort(port) {
  const isWin = process.platform === "win32";
  const pids = isWin
    ? pidsListeningOnPortWindows(port)
    : pidsListeningOnPortUnix(port);
  if (pids.length === 0) {
    console.log(`[hbys] Port ${port} boş.`);
    return;
  }
  for (const pid of pids) {
    try {
      if (isWin) {
        execSync(`taskkill /PID ${pid} /T /F`, { stdio: "ignore" });
      } else {
        process.kill(pid, "SIGTERM");
      }
      console.log(
        `[hbys] Port ${port} üzerindeki süreç kapatıldı (pid ${pid}).`,
      );
    } catch (err) {
      console.warn(
        `[hbys] pid ${pid} kapatılamadı:`,
        err instanceof Error ? err.message : err,
      );
    }
  }
}

/** Bu projenin Metro portu + klasik Expo artıklarını temizler. */
function freeMetroPorts() {
  const port = resolveMetroPort();
  for (const p of unique([port, 8081, 8082, 8088])) {
    freePort(p);
  }
}

if (require.main === module) {
  freeMetroPorts();
}

module.exports = { freePort, freeMetroPorts };
