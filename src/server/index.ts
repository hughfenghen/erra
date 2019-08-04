import Koa from 'koa';
import cors from '@koa/cors';
import httpProxy from 'http-proxy';
import Router from 'koa-router';
// https://github.com/saskodh/http-proxy-response-rewrite
import modifyResponse from 'node-http-proxy-json';

import './socket-server';
import { throughBP4Resp, throughBP4Req, enableBreakpoint, disableBreakpoint } from './breakpoint-manager';
import { broadcast } from './socket-server';
import { handleReq, handleResp, SimpleResp } from '../lib/api-manager';
import { pick } from 'lodash/fp';

const app = new Koa();
const router = new Router()

const proxy = httpProxy.createProxyServer({})

proxy.on('proxyReq', function (proxyReq, req, res, options) {
  proxyReq.setHeader('X-Special-Proxy-Header', 'foobar');
  handleReq(req)
});

proxy.on('proxyRes', function (proxyRes, req, resp) {
  const _writeHead = resp.writeHead;

  // resp 是原始的response，statusCode：404，没有headers、body
  // proxyRes是代理服务强请求的response，是目标服务器返回的内容
  modifyResponse(resp, proxyRes, async function (originBody) {
    const { statusCode, body, headers } = handleResp(
      <SimpleResp><unknown>
      Object.assign(
        pick(['statusCode', 'headers',])(proxyRes), 
        { url: req.url, uuid: req.uuid, body: originBody }
      )
    )

    resp.writeHead = (code, orignHeaders) => {
      _writeHead.call(resp, statusCode, Object.assign({}, orignHeaders, headers))
    };

    // const mbody = await throughBP4Resp(resp, body)
    // await sleep(3000)
    return body; // return value can be a promise
  });
});

router.get('/erra/enable-breakpoint', (ctx, next) => {
  const { url, type } = ctx.query
  // ctx.router available
  enableBreakpoint(url, type)
  ctx.body = 'success'
})

router.get('/erra/disable-breakpoint', (ctx, next) => {
  const { url, type } = ctx.query
  // ctx.router available
  disableBreakpoint(url, type)
  ctx.body = 'success'
})

router.get('*', async (ctx, next) => {
  ctx.respond = false
  // await sleep(3000)
  // await throughBP4Req(ctx.req)
  proxy.web(ctx.req, ctx.res, {
    // RoutingProxy
    target: 'http://www.mocky.io',
    changeOrigin: true,
    // selfHandleResponse: true,
  });
});

app
  .use(cors())
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3344);
