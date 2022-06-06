const fs  = require('fs');
const FastbootAppServer = require('fastboot-app-server');

let fastbootAppServer = new FastbootAppServer({
  port: 80,
  distPath: "/app/",
  chunkedResponse: false,
  gzip: true,
  log: true,
  buildSandboxGlobals(defaultGlobals) {
    return Object.assign(
      {},
      defaultGlobals,
        {BACKEND_URL: "http://backend"}
    );
  },
});

fastbootAppServer.start();
