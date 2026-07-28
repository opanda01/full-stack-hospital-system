/**
 * Windows firewall: Metro portunun inbound açık olup olmadığını kontrol eder.
 * "Expo Metro" kuralı çoğu kurulumda yalnızca 8081'i açar — başka port = telefonda loading.
 */
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { resolveMetroPort } = require("../metroPort.cjs");

function checkWindowsFirewall(port) {
  if (process.platform !== "win32") return;

  const script = `
$ErrorActionPreference = 'SilentlyContinue'
$need = '${port}'
$open = $false
Get-NetFirewallRule -Enabled True -Direction Inbound -Action Allow | ForEach-Object {
  $f = $_ | Get-NetFirewallPortFilter
  if ($null -eq $f) { return }
  $lp = $f.LocalPort
  if ($lp -eq 'Any') { $open = $true; return }
  if ($lp -is [Array]) {
    if ($lp -contains $need -or $lp -contains [int]$need) { $open = $true }
  } elseif ([string]$lp -eq $need) {
    $open = $true
  }
}
if ($open) { Write-Output 'open' } else { Write-Output 'blocked' }
`;

  const tmp = path.join(os.tmpdir(), `hbys-fw-check-${port}.ps1`);
  try {
    fs.writeFileSync(tmp, script, "utf8");
    const out = execFileSync(
      "powershell",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", tmp],
      { encoding: "utf8", windowsHide: true },
    ).trim();
    if (out.includes("blocked")) {
      console.warn(
        `[hbys] UYARI: Windows güvenlik duvarı TCP ${port} inbound Allow görünmüyor.`,
      );
      console.warn(
        `[hbys] Telefonda loading donarsa: Güvenlik Duvarı > Inbound > TCP ${port} Allow (Private+Public).`,
      );
    } else {
      console.log(`[hbys] Firewall TCP ${port}: inbound Allow mevcut.`);
    }
  } catch {
    console.warn(
      `[hbys] Firewall durumu okunamadı. Port ${port} telefonda erişilemezse Windows Allow kuralı ekleyin.`,
    );
  } finally {
    try {
      fs.unlinkSync(tmp);
    } catch {
      /* ignore */
    }
  }
}

function ensureWindowsFirewall(port) {
  checkWindowsFirewall(port);
}

if (require.main === module) {
  ensureWindowsFirewall(resolveMetroPort());
}

module.exports = { ensureWindowsFirewall, checkWindowsFirewall };
