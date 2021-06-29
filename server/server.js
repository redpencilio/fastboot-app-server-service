let FastbootAppServer = require('fastboot-app-server');
const fs  = require('fs');

// Docker Enviroment Variables
const PREFIX = "EMBER_";
const EMBER_CONFIG = Object.entries(process.env)
      .filter(([key]) => key.indexOf(PREFIX) === 0)
      .map(([key, value]) => [key.slice(PREFIX.length), value]);

let indexHtml = fs.readFileSync("/app/index.html", "utf8");
for (const [key, value] of EMBER_CONFIG) {
  console.log(`Replacing name ${key} with value ${value}`);
  indexHtml = indexHtml.replace( new RegExp(`{{${key}}}`, "g"), encodeURIComponent(value) );
  indexHtml = indexHtml.replace( new RegExp(`%7B%7B${key}%7D%7D`, "g"), encodeURIComponent(value) );
}
fs.writeFileSync("/app/index.html", indexHtml);

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
