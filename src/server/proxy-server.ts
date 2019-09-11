import httpProxy from 'http-proxy';
import https from 'https';
import http from 'http';
import net from 'net';
import URL from 'url';
import fs from 'fs';
import pem from 'pem';
import path from 'path';
import { createSecureContext } from 'tls';
import { promisify } from 'es6-promisify';

const proxy = httpProxy.createProxyServer({})

const fsReadFile = promisify(fs.readFile);
const pemCreateCertificate = promisify(pem.createCertificate);

async function getRoot() {
  return {
    cert: await fsReadFile(path.join(process.cwd(), 'ca/erra.crt.pem'), {
      encoding: 'utf-8',
    }),
    key: await fsReadFile(path.join(process.cwd(), 'ca/erra.key.pem'), {
      encoding: 'utf-8',
    }),
  };
}

async function createCertificate(host) {
  // todo cache
  const root = await getRoot();
  const res = await pemCreateCertificate({
    altNames: [host],
    commonName: host,
    days: 365,
    serviceCertificate: root.cert,
    serviceKey: root.key,
  });
  return {
    cert: res.certificate,
    key: res.clientKey,
  };
}

(async function init() {
  const serverCrt = await createCertificate('internal_https_server');

  // https://github.com/http-party/node-http-proxy/issues/1118
  // https://github.com/http-party/node-http-proxy/issues/596
  const httpsServer = https.createServer({
    SNICallback: (servername, cb) => {
      console.log(11112, servername);
      createCertificate(servername).then(({ cert, key }) => {
        cb(null, createSecureContext({ cert, key }));
      });
    },
    cert: serverCrt.cert,
    key: serverCrt.key,
  }, (req, resp) => {
    // resp.end("Hello, SSL World!");
    const url = URL.parse(req.url)
    console.log(1111, req.headers, url);

    // // 不记录map请求
    // if (!/\.map$/.test(req.url)) {
    //   const record = handleReq(req)

    //   const { req: mReq } = await throughBP4Req(record)
    //   Object.assign(req, mReq)
    // }
    proxy.web(req, resp, {
      target: `https://${req.headers.host}`,
      secure: false,
    });
  });

  httpsServer.listen(3355, '0.0.0.0');


  const httpServer = http.createServer()
  httpServer.listen(3344, '0.0.0.0');
  httpServer.on('connect', (req, socket) => {
    console.log(11114, req.url, socket.remoteAddress);
    // const tarUrl = value
    const conn = net.connect(3355, '127.0.0.1', () => {

      socket.write('HTTP/' + req.httpVersion + ' 200 OK\r\n\r\n', 'UTF-8', () => {
        conn.pipe(socket);
        socket.pipe(conn);
      });

    });
  })
})();

export default function registerHandler(reqHandler, respHandler) {
  // body
}