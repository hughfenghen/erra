import httpProxy from 'http-proxy';
import https from 'https';
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

async function create(host) {
  // --- 生成证书
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
  const serverCrt = await create('internal_https_server');

  // https://github.com/http-party/node-http-proxy/issues/1118
  // https://github.com/http-party/node-http-proxy/issues/596
  const httpsServer = https.createServer({
    SNICallback: (servername, cb) => {
      create(servername).then(crt => {
        const ctx = createSecureContext({
          cert: crt.cert,
          key: crt.key,
        });
        cb(null, ctx);
      });
    },
    cert: serverCrt.cert,
    key: serverCrt.key,
  }, (req, resp) => {
    resp.end("Hello, SSL World!");
    // const url = URL.parse(req.url)

    // // 不记录map请求
    // if (!/\.map$/.test(req.url)) {
    //   const record = handleReq(req)

    //   const { req: mReq } = await throughBP4Req(record)
    //   Object.assign(req, mReq)
    // }

    // proxy.web(req, resp, {
    //   target: `${url.protocol}//${url.host}`,
    // });
  });

  httpsServer.listen(3355, '0.0.0.0');
})();

export default function registerHandler(reqHandler, respHandler) {
  // body
}