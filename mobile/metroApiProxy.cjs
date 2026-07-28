const http = require("node:http");

const BACKEND_HOST = process.env.HBYS_BACKEND_HOST || "127.0.0.1";
const BACKEND_PORT = Number(process.env.HBYS_BACKEND_PORT || "8000");
const PREFIX = "/hbys-api";

function createMetroApiProxyMiddleware() {
  return (req, res, next) => {
    const raw = req.url || "";
    const pathOnly = raw.split("?")[0] || "";
    if (!pathOnly.startsWith(PREFIX) && !pathOnly.startsWith(`${PREFIX}/`)) {
      return next();
    }

    const backendPath = pathOnly.slice(PREFIX.length) || "/";
    const query = raw.includes("?") ? raw.slice(raw.indexOf("?")) : "";
    const headers = { ...req.headers, host: `${BACKEND_HOST}:${BACKEND_PORT}` };
    delete headers.connection;

    const proxyReq = http.request(
      {
        hostname: BACKEND_HOST,
        port: BACKEND_PORT,
        path: backendPath + query,
        method: req.method,
        headers,
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
        proxyRes.pipe(res);
      },
    );

    proxyReq.on("error", (err) => {
      if (!res.headersSent) {
        res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
      }
      res.end(
        `Backend proxy (${BACKEND_HOST}:${BACKEND_PORT}): ${err.message}. Docker ayakta mı?`,
      );
    });

    if (req.method === "GET" || req.method === "HEAD") {
      proxyReq.end();
    } else {
      req.pipe(proxyReq);
    }
  };
}

module.exports = { PREFIX, createMetroApiProxyMiddleware };
