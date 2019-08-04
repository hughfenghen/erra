import { broadcast } from '../server/socket-server';
import { getSnippet } from './snippet-manager';
import configManager from './config-manager';

interface SimpleReq {
  url: string,
  method: string,
  headers: Object,
  body?: any,
}

export interface SimpleResp {
  uuid: string,
  url: string,
  statusCode?: number,
  headers: Object,
  body?: any,
}

interface ApiRecord {
  uuid: string,
  req: SimpleReq,
  resp?: SimpleResp,
}

const apiSnippetPair: [((url: string) => boolean), string][] = []
const apiHistory: ApiRecord[] = []

configManager.on('afterConfigInit', () => {
  // todo init apiSnippetPair
})

export function handleReq(req: SimpleReq) {
  // todo: cookie, formData, body 
  console.log(3331, req.headers, req.url, req.method);
  const { headers, url, method } = req
  const simpleReq = {
    uuid: '',
    req: { headers, url, method },
  }
  apiHistory.push(simpleReq)
  noticeApiUpdate('req', simpleReq)
}

export function handleResp(resp: SimpleResp): SimpleResp {
  console.log(3332, resp);
  const snippetId = (apiSnippetPair.find(([match]) => match(resp.url)) || [])[1]
  const rs = snippetId ? getSnippet(snippetId)(resp) : resp
  
  noticeApiUpdate('resp', rs)
  return rs
}

export function connectApiSnippet(matcher: string, snippetId: string) {
  apiSnippetPair.push([
    // 正则反序列化，需要替换前后'/'
    (url) => RegExp(matcher.slice(1, matcher.length - 1)).test(url), 
    snippetId
  ])
}

function noticeApiUpdate (type: 'req' | 'resp', content) {
  console.log(99999999, broadcast(`api-manager_${type}`, content));
}