import URL from 'url';
import { SimpleReq, ParsedUrl, SimpleResp } from './interface';
import { isString } from 'lodash/fp';

export function sleep(millisecond: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, millisecond);
  })
}

// 从req中解析处完整的 url 信息
export function parseUrl4Req(req: SimpleReq): ParsedUrl {
  const u = URL.parse(req.url)
  // 添加origin字段
  const url: ParsedUrl = { origin: null, ...u }
  
  if (url.protocol && url.host) {
    url.origin = `${url.protocol}//${url.host}`
    url.shortHref = `${url.origin}${url.pathname}`
    return url
  }

  // https 请求，req.url中只有path
  url.host = req.headers.host 
  // todo 兼容ws、wss协议
  url.protocol = 'https:'
  
  url.origin = `${url.protocol}//${url.host}`
  url.shortHref = `${url.origin}${url.pathname}`
  url.href = `${url.shortHref}${url.search || ''}${url.hash || ''}`

  return url
}

/**
 * 尝试将任意对象解析为JSON对象，如果解析失败则返回原对象，不会抛出错误
 */
export function safeJSONParse(val) {
  if (!isString(val)) return val
  try {
    return JSON.parse(val)
  } catch (e) {
    return val
  }
}

/**
 * 判断当前返回类型是否是文本
 * @param resp SimpleResp
 */
export function isTextResp(resp: SimpleResp): boolean {
  const ct = resp.headers['content-type'] || resp.headers['Content-Type']
  if (!ct) return false
  return /text|json|javascript|xml|svg|csv|html?|css/.test(ct)
}