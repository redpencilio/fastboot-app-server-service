let FastbootAppServer = require('fastboot-app-server');
const fs  = require('fs');

// Docker Enviroment Variables
let indexHtmlFile = fs.readFileSync("/app/index.html", "utf8");
for( const envVar in process.env ) {
  console.log(`Processing ${envVar}...`);
  if( envVar.indexOf("EMBER_") === 0 ) {
    console.log(`Replacing name ${envVar} with value ${process.env[envVar]}`);
    indexHtmlFile = indexHtmlFile.replace( new RegExp(envVar, "g"), encodeURIComponent(process.env[envVar]) );
  } else {
    console.log(`Environment variable ${envVar} not recognized for replacement.  Only variables starting with EMBER_ are used.`);
  }
}
fs.writeFileSync("/app/index.html", indexHtmlFile);

let fastbootAppServer = new FastbootAppServer({
  port: 80,
  distPath: "/app/",
  chunkedResponse: true,
  sandboxGlobals: { 
    BACKEND_URL: "http://backend/",
   }
});

fastbootAppServer.start();
