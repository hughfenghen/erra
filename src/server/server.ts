import http from 'http';
import https from 'https';
import ip from 'ip';
import net from 'net';
import { createSecureContext } from 'tls';

import configManager from './manager/config-manager';
import { createCert } from '../lib/cert';

const plugins = []

async function httpHandler(req, resp) {
  try {
    let handled = false
    for (let i in plugins) {
      // 某个插件返回false 表示中断，当前请求已被response.end()
      if (!await plugins[i](req, resp)) {
        handled = true
        break;
      }
    }

    // 请求未被任何插件处理 返回404
    if (!handled) {
      resp.writeHead(404, { 'Content-Type': 'text/plain;charset=utf-8' });
      resp.end();
    }
  } catch (err) {
    console.error(err);
    resp.writeHead(500, { 'Content-Type': 'text/plain;charset=utf-8' });
    resp.end(err.toString());
  }
}

// 最简单的方式注册中间件
function use(fn: (req: http.IncomingMessage, resp: http.ServerResponse) => void) {
  plugins.push(fn)
}

const httpServer = http.createServer(httpHandler)
const httpsServerPromise = (async () => {
  const serverCrt = await createCert(ip.address());

  return https.createServer({
    async SNICallback(servername, cb) {
      const { cert, key } = await createCert(servername)
      cb(null, createSecureContext({ cert, key }))
    },
    cert: serverCrt.cert,
    key: serverCrt.key,
  }, httpHandler);
})();

// 启动https服务器需要生成证书，是异步过程，所以通过给异步函数获取
async function getHttpsServer() {
  return await httpsServerPromise
}

async function run({ httpPort, httpsPort }) {
  
  httpServer.on('connect', (req, socket) => {
    let proxyPort = httpPort;
    // todo: connect请求时 如何判断连到的目标机器是不是https协议？
    const [, targetPort] = req.url.split(':');
    if (targetPort === '443') {
      proxyPort = httpsPort;
    }

    try {
      const conn = net.connect(proxyPort, '127.0.0.1', () => {
        socket.write('HTTP/' + req.httpVersion + ' 200 OK\r\n\r\n', 'UTF-8', () => {
          conn.pipe(socket);
          socket.pipe(conn);
        });
      });
    } catch (err) {
      console.error(err);
    }
  })

  httpServer.listen(httpPort, '0.0.0.0', () => {
    console.log(`本地代理服务已启动，http_proxy=http://${ip.address()}:${httpPort}`);
  });
  (await getHttpsServer()).listen(httpsPort, '0.0.0.0', () => {
    console.log(`erra管理界面地址，https://${ip.address()}:${httpsPort}/erra`);
  });
}

export default {
  httpServer,
  getHttpsServer,
  run,
  use,
  isLocalServer(req) {
    return req
      .headers
      .host
      .includes(`:${configManager.get('SERVICE_CONFIG').httpsPort}`)
      && ['localhost', '127.0.0.1', '0.0.0.0', ip.address()]
        .some((host) => req.headers.host.includes(host))
  },
}