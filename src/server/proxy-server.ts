import httpProxy from 'http-proxy';
import http from 'http';
import https from 'https';
import URL from 'url';
import server from './server';
import { ApiRecord, SimpleReq } from '../lib/interface';
import { parseUrl4Req } from '../lib/utils';

let beforeProxyReqHandler: (req, resp) => Promise<ApiRecord | null> = async () => null

// 当被代理的请求headers.Connection = keep-alive时，需要设置agent，否则会报错
// http、https的agent不同，所以需要创建两个proxy实例
const proxy = httpProxy.createProxyServer({ ws: true, agent: http.globalAgent })
const proxyS = httpProxy.createProxyServer({ ws: true, agent: https.globalAgent })

const proxyErrorHandler = (err, req, res) => {
  console.error(err);
  res.writeHead(500, { 'Content-Type': 'text/plain;charset=utf-8' });
  res.end('请检查目标服务和Erra是否正常工作。\n' + err.toString());
}

proxy.on('error', proxyErrorHandler);
proxyS.on('error', proxyErrorHandler);

// 简单转发，暂不考虑断点、编辑ws请求
server.httpServer.on('upgrade', (req, socket, head) => {
  proxy.ws(req, socket, head, { target: `ws://${req.headers.host}` });
});

server.use(async (req: http.IncomingMessage, resp: http.ServerResponse) => {
  // 避免代理Erra资源，否则导致死循环
  if (server.isLocalServer(req)) return true
  
  const url = URL.parse(req.url)
  const record = await beforeProxyReqHandler(req, resp)
  let parsedUrl = null
  if (record) {
    Object.assign(req, record.req)
    parsedUrl = record.parsedUrl
  } else {
    parsedUrl = parseUrl4Req(<SimpleReq><unknown>req)
  }

  (parsedUrl.protocol === 'http:' ? proxy : proxyS)
    .web(req, resp, {
      target: `${parsedUrl.protocol}//${req.headers.host}`,
      secure: false,
      ws: true,
    });
  return false
})

export default {
  beforeProxyReq(handler) {
    beforeProxyReqHandler = handler
  },
  afterProxyResp(handler) {
    proxy.on('proxyRes', handler)
    proxyS.on('proxyRes', handler)
  }
}