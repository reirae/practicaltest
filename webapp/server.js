const fs = require('fs');
const https = require('https');
const http = require('http');
const app = require('./app');

const HTTPS_PORT = 443;
const HTTP_PORT = 8080;

// Q2: self-signed HTTPS, accessible via https://127.0.0.1/
https
  .createServer(
    {
      key: fs.readFileSync('/certs/privkey.pem'),
      cert: fs.readFileSync('/certs/fullchain.pem'),
    },
    app
  )
  .listen(HTTPS_PORT, () => console.log(`HTTPS listening on ${HTTPS_PORT}`));

// Q5: GitHub Actions UI test runs "over http" - plain listener for that
http.createServer(app).listen(HTTP_PORT, () => console.log(`HTTP listening on ${HTTP_PORT}`));
