import URL from 'url';
import { SimpleReq, ParsedUrl } from './interface';

export function sleep(millisecond) {
  return new Promise((resolve) => {
    setTimeout(resolve, millisecond);
  })
}

// 从req中解析处完整的 url 信息
export function parseUrl4Req(req: SimpleReq) {
  const u = URL.parse(req.url)
  // 添加origin字段
  const url: ParsedUrl = { origin: null, ...u }
  
  if (url.protocol && url.host) {
    url.origin = `${url.protocol}//${url.host}${url.port ? (':' + url.port) : ''}`
    url.shortHref = `${url.origin}${url.pathname}`
    return url
  }

  // https 请求，req.url中只有path
  url.host = req.headers.host 
  // todo 兼容ws、wss协议
  url.protocol = 'https:'
  
  url.origin = `${url.protocol}//${url.host}${url.port ? (':' + url.port) : ''}`
  url.shortHref = `${url.origin}${url.pathname}`
  url.href = `${url.shortHref}${url.search || ''}${url.hash || ''}`

  return url
}