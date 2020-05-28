let FastbootAppServer = require('fastboot-app-server');

let fastbootAppServer = new FastbootAppServer({
  port: 80,
  distPath: "/app/",
  chunkedResponse: true,
  sandboxGlobals: { BACKEND_URL: "http://backend/" }
});

fastbootAppServer.start();
