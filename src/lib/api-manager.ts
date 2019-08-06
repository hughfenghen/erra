import { broadcast } from '../server/socket-server';
import configManager from './config-manager';
import { getSnippet } from './snippet-manager';

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
  Object.entries(configManager.get('api-match-snippet') || {})
    .forEach(([matcher, snippetId]) => {
      connectApiSnippet(matcher, String(snippetId))
    }) 
})

export function handleReq(req: SimpleReq) {
  // todo: cookie, formData, body 
  const { headers, url, method } = req
  const simpleReq = {
    uuid: '',
    req: { headers, url, method },
  }
  apiHistory.push(simpleReq)
  noticeApiUpdate('req', simpleReq)
}

export function handleResp(resp: SimpleResp): SimpleResp {
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
  broadcast(`api-manager_${type}`, content)
}