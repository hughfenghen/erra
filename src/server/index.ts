import './socket-server';
import URL from 'url';

import cors from '@koa/cors';
import httpProxy from 'http-proxy';
import Koa from 'koa';
import Router from 'koa-router';
import { pick } from 'lodash/fp';
import modifyResponse from 'node-http-proxy-text';

import { SimpleResp } from '../lib/interface';
import { handleReq, handleResp } from './manager/api-manager';
import { throughBP4Req, throughBP4Resp } from './manager/breakpoint-manager';
import configManager from './manager/config-manager';

const app = new Koa();
const router = new Router()

configManager.init(process.argv[process.argv.indexOf('-c') + 1])

const proxy = httpProxy.createProxyServer({})


proxy.on('proxyRes', function (proxyRes, req, resp) {
  const _writeHead = resp.writeHead;

  // resp 是原始的response，statusCode：404，没有headers、body
  // proxyRes是代理服务强请求的response，是目标服务器返回的内容
  modifyResponse(resp, proxyRes, async function (originBody) {
    const record = handleResp(
      <SimpleResp><unknown>
      Object.assign(
        pick(['statusCode', 'headers',])(proxyRes),
        { url: req.url, body: originBody }
      ),
      req
    );

    const { resp: { statusCode, body, headers } } = await throughBP4Resp(record);

    resp.writeHead = (code, orignHeaders) => {
      _writeHead.call(resp, statusCode, Object.assign({}, orignHeaders, headers))
    };
    return typeof body === 'string' ? body : JSON.stringify(body);
  });
});

router.get('*', async (ctx, next) => {
  ctx.respond = false

  const url = URL.parse(ctx.req.url)

  // 不记录map请求
  if (!/\.map$/.test(ctx.req.url)) {
    const record = handleReq(ctx.req)

    const { req: mReq } = await throughBP4Req(record)
    Object.assign(ctx.req, mReq)
  }

  proxy.web(ctx.req, ctx.res, {
    // RoutingProxy
    // target: 'http://www.mocky.io',
    target: `${url.protocol}//${url.host}`,
    // changeOrigin: true,
    // selfHandleResponse: true,
  });
});

app
  .use(cors())
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3344);
