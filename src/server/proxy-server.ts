import httpProxy from 'http-proxy';
import URL from 'url';
import server from './server';

let beforeProxyReqHandler: (req, resp) => Promise<void> = async () => { }

const proxy = httpProxy.createProxyServer({ ws: true })
proxy.on('error', function (err, req, res) {
  console.error(err);
  res.writeHead(500, { 'Content-Type': 'text/plain;charset=utf-8' });
  res.end('请检查目标服务和Erra是否正常工作。\n' + err.toString());
});

// 简单转发，暂不考虑断点、编辑ws请求
server.httpServer.on('upgrade', (req, socket, head) => {
  proxy.ws(req, socket, head, { target: `ws://${req.headers.host}` });
});

server.use(async (req, resp) => {
  const url = URL.parse(req.url)

  await beforeProxyReqHandler(req, resp)

  proxy.web(req, resp, {
    target: `${url.protocol || 'https:'}//${req.headers.host}`,
    secure: false,
    ws: true,
  });
})

export default {
  beforeProxyReq(handler) {
    beforeProxyReqHandler = handler
  },
  afterProxyResp(handler) {
    proxy.on('proxyRes', handler)
  }
}