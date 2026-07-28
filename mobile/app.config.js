const appJson = require("./app.json");
const { pickDevLanHost } = require("./devApiHost.cjs");
const { resolveMetroPort } = require("./metroPort.cjs");

const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const lanHost = pickDevLanHost();
const metroPort = resolveMetroPort();
const devApiBaseUrl =
  envUrl || (lanHost ? `http://${lanHost}:8000` : undefined);

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    ...appJson.expo,
    android: {
      usesCleartextTraffic: true,
    },
    extra: {
      ...(appJson.expo.extra ?? {}),
      devApiBaseUrl,
      metroPort,
      lanHost: lanHost ?? undefined,
    },
  },
};
