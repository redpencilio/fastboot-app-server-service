let FastbootAppServer = require('fastboot-app-server');

// Docker Enviroment Variables
const BASE_URL = process.env.BASE_URL

let fastbootAppServer = new FastbootAppServer({
  port: 80,
  distPath: "/app/",
  chunkedResponse: true,
  sandboxGlobals: { 
    BACKEND_URL: "http://backend/",
    BASE_URL: BASE_URL
   }
});

fastbootAppServer.start();
