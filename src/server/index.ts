import './socket-server';

import { pick } from 'lodash/fp';
import modifyResponse from 'node-http-proxy-text';

import { SimpleReq, SimpleResp } from '../lib/interface';
import { handleReq, handleResp } from './manager/api-manager';
import { throughBP4Req, throughBP4Resp } from './manager/breakpoint-manager';
import configManager from './manager/config-manager';
import proxyServer from './proxy-server';
import { safeJSONParse } from '../lib/utils';

// 初始化配置
configManager.init(process.argv[process.argv.indexOf('-c') + 1])

proxyServer.afterProxyResp((proxyRes, req, resp) => {
  // 不处理map请求
  if (/\.map$/.test(req.url)) return

  const _writeHead = resp.writeHead;

  // resp 是浏览器跟Erra的链接
  // proxyRes 是Erra跟远程服务器的连接
  modifyResponse(resp, proxyRes, async function (originBody) {
    const record = handleResp(
      <SimpleResp><unknown>
      Object.assign(
        pick(['statusCode', 'headers',])(proxyRes),
        { body: safeJSONParse(originBody) }
      ),
      req as SimpleReq
    );
    if (!record) return originBody

    const { resp: { statusCode, body, headers } } = await throughBP4Resp(record);

    resp.writeHead = (code, orignHeaders) => {
      return _writeHead.call(resp, statusCode, Object.assign({}, orignHeaders, headers))
    };
    
    return typeof body === 'string' ? body : JSON.stringify(body || null);
  });
});

proxyServer.beforeProxyReq(async (req) => {
  // 不记录map请求
  if (!/\.map$/.test(req.url)) {
    const record = handleReq(req)

    const { req: mReq } = await throughBP4Req(record)
    Object.assign(req, mReq)
  }
})
