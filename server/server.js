const fs  = require('fs');
const FastbootAppServer = require('fastboot-app-server');

let fastbootAppServer = new FastbootAppServer({
  port: 80,
  distPath: "/app/",
  chunkedResponse: false,
  gzip: true,
  sandboxGlobals: {
    BACKEND_URL: "http://backend",
   }
});

fastbootAppServer.start();
