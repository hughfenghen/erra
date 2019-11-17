import fs from 'fs';
import { pick } from 'lodash/fp';
import LRU from 'lru-cache';
import modifyResponse from 'node-http-proxy-text';
import path from 'path';
import { SimpleReq, SimpleResp } from '../lib/interface';
import { safeJSONParse, isTextResp } from '../lib/utils';
import { handleReq, handleResp } from './manager/api-manager';
import { throughBP4Req, throughBP4Resp } from './manager/breakpoint-manager';
import configManager from './manager/config-manager';
import proxyServer from './proxy-server';
import server from './server';
import ss from './socket-server';


process.on('uncaughtException', function (err) {
  console.error('---uncaughtException', err);
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const fileCache = new LRU({
  max: 50,
  maxAge: Infinity,
})

// 极简版静态服务器，将erra path下的请求映射到文件
server.use((req, resp) => {
  if (server.isLocalServer(req) && req.url.includes('/erra')) {
    const filePath = path.resolve(
      process.cwd(),
      './dist/client',
      req.url.replace(/^\/erra\/?/, '') || './index.html'
    )
    if (!fs.existsSync(filePath)) {
      resp.writeHead(404, { 'Content-Type': 'text/plain;charset=utf-8' });
      resp.end();
      return false
    }
    let content = fileCache.get(filePath)
    if (!content) {
      content = fs.readFileSync(filePath)
      fileCache.set(filePath, content)
    }
    if (/\.pem$/.test(req.url)) {
      resp.writeHead(200, { 'Content-Type': 'application/x-pem-file' })
    }
    resp.end(content, 'utf8');
    return false
  }
  return true
})

// 初始化配置
configManager.init(process.argv[process.argv.indexOf('-c') + 1])

configManager.on('afterConfigInit', (cfg) => {
  server.run({
    httpPort: cfg.SERVICE_CONFIG.httpPort,
    httpsPort: cfg.SERVICE_CONFIG.httpsPort,
  })
  ss.run()
})

proxyServer.afterProxyResp((proxyRes, req, resp) => {
  const _writeHead = resp.writeHead;
  const _end = resp.end;

  // 不处理sourcemap请求
  if (/\.map$/.test(req.url)) return

  if (isTextResp(proxyRes)) {
    // resp 是浏览器跟Erra的链接, proxyRes 是Erra跟远程服务器的连接
    // 如果是文本则 解压后再处理
    modifyResponse(resp, proxyRes, processResp);
    return
  } else {
    processResp()
    return
  }

  async function processResp(originBody = '') {
    const record = handleResp(
      <SimpleResp>
      Object.assign(
        pick(['statusCode', 'headers'])(proxyRes),
        { body: safeJSONParse(originBody) }
      ),
      req as SimpleReq
    );
    if (!record) return originBody

    try {
      const { resp: { statusCode, body, headers } } = await throughBP4Resp(record);
      resp.writeHead = (code, orignHeaders) => {
        return _writeHead.call(resp, statusCode, Object.assign({}, orignHeaders, headers))
      };

      return typeof body === 'string' ? body : JSON.stringify(body || null);
    } catch (err) {
      _writeHead.call(resp, 500, { 'Content-Type': 'text/plain;charset=utf-8' });
      _end.call(resp, err.toString());
      throw err
    }
  }
});

proxyServer.beforeProxyReq(async (req) => {
  // 不记录map请求
  if (!/\.map$/.test(req.url)) {
    const record = handleReq(req)
    if (!record) return

    const { req: mReq } = await throughBP4Req(record)
    Object.assign(req, mReq)
  }
})
