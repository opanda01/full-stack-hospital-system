/** @typedef {import('node:os').NetworkInterfaceInfo} NetworkInterfaceInfo */

/**
 * Geliştirme makinesinin LAN IPv4 adresini seçer (Metro başlarken app.config'te kullanılır).
 * Sanal adaptörleri (VirtualBox, Hyper-V vb.) düşük öncelikli tutar.
 */
function scoreLanIp(ip) {
  if (ip.startsWith("192.168.56.")) return 0;
  if (ip.startsWith("172.23.16.")) return 1;
  if (ip.startsWith("192.168.")) return 10;
  if (ip.startsWith("172.20.")) return 10;
  if (ip.startsWith("10.")) return 8;
  if (ip.startsWith("172.")) return 5;
  return 3;
}

function scoreInterface(name, ip) {
  const n = name.toLowerCase();
  let score = scoreLanIp(ip);
  if (n.includes("wi-fi") || n.includes("wifi") || n.includes("wlan")) score += 20;
  if (n.includes("ethernet") && !n.includes("virtual") && !n.includes("vethernet"))
    score += 15;
  if (n.includes("vethernet") || n.includes("wsl") || n.includes("hyper-v")) score -= 30;
  if (n.includes("virtualbox") || n === "ethernet 2") score -= 30;
  if (ip.startsWith("169.254.")) score -= 50;
  return score;
}

function pickDevLanHost() {
  const os = require("node:os");
  /** @type {{ ip: string; name: string; score: number }[]} */
  const ranked = [];
  for (const [name, iface] of Object.entries(os.networkInterfaces())) {
    for (const cfg of iface ?? []) {
      if (cfg.family !== "IPv4" || cfg.internal) continue;
      ranked.push({
        ip: cfg.address,
        name,
        score: scoreInterface(name, cfg.address),
      });
    }
  }
  if (ranked.length === 0) return null;
  ranked.sort((a, b) => b.score - a.score);
  return ranked[0]?.ip ?? null;
}

function listDevLanHosts() {
  const os = require("node:os");
  /** @type {{ ip: string; name: string; score: number }[]} */
  const ranked = [];
  for (const [name, iface] of Object.entries(os.networkInterfaces())) {
    for (const cfg of iface ?? []) {
      if (cfg.family !== "IPv4" || cfg.internal) continue;
      ranked.push({
        ip: cfg.address,
        name,
        score: scoreInterface(name, cfg.address),
      });
    }
  }
  ranked.sort((a, b) => b.score - a.score);
  return ranked;
}

module.exports = { pickDevLanHost, scoreLanIp, listDevLanHosts };
