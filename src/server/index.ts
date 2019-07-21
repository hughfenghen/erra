import Koa from 'koa';
import cors from '@koa/cors';
import httpProxy from 'http-proxy';
import Router from 'koa-router';
import modifyResponse from 'node-http-proxy-json';

import './socket-server';
import { throughBP4Resp, throughBP4Req, enableBreakpoint, disableBreakpoint } from './breakpoint-manager';
import { broadcast } from './socket-server';

const app = new Koa();
const router = new Router()

const proxy = httpProxy.createProxyServer({})

proxy.on('proxyReq', function (proxyReq, req, res, options) {
  proxyReq.setHeader('X-Special-Proxy-Header', 'foobar');
});

proxy.on('proxyRes', function (proxyRes, req, res) {
  modifyResponse(res, proxyRes, async function (body) {
    broadcast('api-response', req.url, body)
    const mbody = await throughBP4Resp(res, body)
    // await sleep(3000)
    return mbody; // return value can be a promise
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
  await throughBP4Req(ctx.req)
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
