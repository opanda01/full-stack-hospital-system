const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
require("./expoApiProxyHook.cjs");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function pathBlockRegex(...segments) {
  const abs = path.resolve(workspaceRoot, ...segments);
  return new RegExp(`^${escapeRegex(abs).replace(/[/\\\\]/g, "[/\\\\]")}[/\\\\].*`);
}

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
config.resolver.disableHierarchicalLookup = true;

config.resolver.unstable_enablePackageExports = false;

config.resolver.emptyModulePath = require.resolve(
  "metro-runtime/src/modules/empty-module.js",
  { paths: [workspaceRoot, projectRoot] },
);

// Monorepo: backend/web ağacını izleme (Windows'ta başlangıç yavaşlığı).
config.resolver.blockList = [
  pathBlockRegex("backend"),
  pathBlockRegex("web"),
  /[/\\]\.git[/\\]/,
  /[/\\]\.expo-export-test[/\\]/,
];

module.exports = config;
