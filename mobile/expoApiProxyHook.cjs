const { createMetroApiProxyMiddleware } = require("./metroApiProxy.cjs");

function resolveBundlerDevServer() {
  const mod = require("@expo/cli/build/src/start/server/BundlerDevServer");
  return mod.BundlerDevServer ?? mod.default;
}

function prependConnectMiddleware(app, middleware) {
  app.use(middleware);
  if (Array.isArray(app.stack) && app.stack.length > 0) {
    app.stack.unshift(app.stack.pop());
  }
}

function installExpoApiProxyHook() {
  if (globalThis.__hbysExpoApiProxyHookInstalled) return;
  globalThis.__hbysExpoApiProxyHookInstalled = true;

  try {
    // metro.config, startImplementationAsync içinde yüklenir; o yüzden
    // startImplementationAsync patch'i geç kalır. setInstance, middleware
    // hazır olduktan sonra çağrılır — proxy'yi orada enjekte ediyoruz.
    const BundlerDevServer = resolveBundlerDevServer();
    if (!BundlerDevServer?.prototype?.setInstance) {
      throw new Error("BundlerDevServer.setInstance not found");
    }

    const apiProxy = createMetroApiProxyMiddleware();
    const origSetInstance = BundlerDevServer.prototype.setInstance;

    BundlerDevServer.prototype.setInstance = function setInstanceWithApiProxy(
      instance,
    ) {
      const middleware = instance?.middleware;
      if (middleware?.stack) {
        const already = middleware.stack.some(
          (layer) => layer.handle === apiProxy,
        );
        if (!already) {
          prependConnectMiddleware(middleware, apiProxy);
          // eslint-disable-next-line no-console
          console.log(
            "[hbys] Dev API proxy aktif: /hbys-api/* → http://127.0.0.1:8000/*",
          );
        }
      }
      return origSetInstance.call(this, instance);
    };
  } catch (err) {
    // Metro config must still load on Windows; a failed hook must not crash startup.
    // eslint-disable-next-line no-console
    console.warn(
      "[hbys] Dev API proxy kurulamadı:",
      err instanceof Error ? err.message : err,
    );
  }
}

installExpoApiProxyHook();

module.exports = { installExpoApiProxyHook };
