import './socket-server';

import { pick } from 'lodash/fp';
import modifyResponse from 'node-http-proxy-text';
import URL from 'url';

import { SimpleReq, SimpleResp } from '../lib/interface';
import { handleReq, handleResp } from './manager/api-manager';
import { throughBP4Req, throughBP4Resp } from './manager/breakpoint-manager';
import configManager from './manager/config-manager';
import proxyServer from './proxy-server';

// 初始化配置
configManager.init(process.argv[process.argv.indexOf('-c') + 1])

proxyServer.afterProxyResp((proxyRes, req, resp) => {
  const _writeHead = resp.writeHead;

  // resp 是原始的response，statusCode：404，没有headers、body
  // proxyRes是代理服务强请求的response，是目标服务器返回的内容
  modifyResponse(resp, proxyRes, async function (originBody) {
    const record = handleResp(
      <SimpleResp><unknown>
      Object.assign(
        pick(['statusCode', 'headers',])(proxyRes),
        { body: originBody }
      ),
      req as SimpleReq
    );
    if (!record) return originBody

    const { resp: { statusCode, body, headers } } = await throughBP4Resp(record);

    resp.writeHead = (code, orignHeaders) => {
      return _writeHead.call(resp, statusCode, Object.assign({}, orignHeaders, headers))
    };
    
    return body;
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
