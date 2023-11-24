const FastbootAppServer = require('fastboot-app-server');
let config;
try {
  config = require("/app/fastboot");
} catch (e) {
  console.info("No fastboot config found in the app, using default");
}
let customConfig = {};

if (config) {
  if (typeof config === "function") {
    customConfig = config();
  } else if (typeof config === "object") {
    customConfig = config;
  }
}

let fastbootAppServer = new FastbootAppServer({
  port: 80,
  distPath: "/app/",
  chunkedResponse: false,
  gzip: true,
  log: true,
  buildSandboxGlobals(defaultGlobals) {
    return Object.assign({}, defaultGlobals, {
      AbortController,
      ReadableStream:
        typeof ReadableStream !== "undefined"
          ? ReadableStream
          : require("node:stream/web").ReadableStream,
      WritableStream:
        typeof WritableStream !== "undefined"
          ? WritableStream
          : require("node:stream/web").WritableStream,
      TransformStream:
        typeof TransformStream !== "undefined"
          ? TransformStream
          : require("node:stream/web").TransformStream,
      Headers: typeof Headers !== "undefined" ? Headers : undefined,
      BACKEND_URL: "http://backend",
    });
  },
  ...customConfig,
});

fastbootAppServer.start();
