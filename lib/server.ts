const Koa = require('koa');
const http = require('http')
const httpProxy = require('http-proxy')
const Router = require('koa-router')
const modifyResponse = require('node-http-proxy-json')

const app = new Koa();
const router = new Router()

function sleep(millisecond) {
  return new Promise((resolve) => {
    setTimeout(resolve, millisecond);
  })
}

const proxy = httpProxy.createProxyServer({})
proxy.on('proxyRes', function (proxyRes, req, res) {
  modifyResponse(res, proxyRes, async function (body) {
    console.log(4444, body);
    await sleep(1000)
    body.code = 401
    return body; // return value can be a promise
  });
});

router.get('/erra/enable-breakpoint', (ctx, next) => {
  // ctx.router available
});

router.get('*', async (ctx, next) => {
  ctx.respond = false
  await sleep(1000)
  proxy.web(ctx.req, ctx.res, { 
    target: 'http://yapi.sankuai.com', 
    changeOrigin: true,
    // selfHandleResponse: true,
  });
});

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3344);
