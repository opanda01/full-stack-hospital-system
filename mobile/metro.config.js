const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
config.resolver.disableHierarchicalLookup = true;

// getDevServer "Object" hatasını önler (yanlış package exports)
config.resolver.unstable_enablePackageExports = false;

config.resolver.emptyModulePath = require.resolve(
  "metro-runtime/src/modules/empty-module.js",
  { paths: [workspaceRoot, projectRoot] },
);

module.exports = config;
