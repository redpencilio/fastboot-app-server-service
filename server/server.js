let FastbootAppServer = require('fastboot-app-server');
const fs  = require('fs');

// Docker Enviroment Variables
const BASE_URL = process.env.BASE_URL;
let indexFile = fs.readFileSync("/app/index.html", "utf8");
fs.writeFileSync("/app/index.html", indexFile.replace(/EMBER_METIS_BASE_URL/g, encodeURIComponent(BASE_URL)));

let fastbootAppServer = new FastbootAppServer({
  port: 80,
  distPath: "/app/",
  chunkedResponse: true,
  sandboxGlobals: { 
    BACKEND_URL: "http://backend/",
   }
});

fastbootAppServer.start();
