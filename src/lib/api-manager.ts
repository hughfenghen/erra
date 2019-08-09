import { find } from 'lodash/fp';
import genUUID from 'uuid';

import { broadcast } from '../server/socket-server';
import configManager from './config-manager';
import { getSnippet } from './snippet-manager';

interface StrObj {
  [x: string]: string,
}

interface SimpleReq {
  [x: string]: any;
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS',
  headers: StrObj,
  body?: any,
}

function noticeApiUpdate(type: string, content = {}) {
  broadcast(`api-manager_${type}`, content)
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
let apiRecords: ApiRecord[] = []

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
  const record = {
    uuid: genUUID(),
    req: { headers, url, method },
  }
  req._erra_uuid = record.uuid
  apiRecords.push(record)
  noticeApiUpdate('new', record)
}

export function handleResp(resp: SimpleResp, req: SimpleReq): SimpleResp {
  const snippetId = (apiSnippetPair.find(([match]) => match(resp.url)) || [])[1]
  const rs = snippetId ? getSnippet(snippetId)(resp) : resp
  
  const record = <ApiRecord>find({ uuid: req._erra_uuid })(apiRecords)
  if (record) {
    record.resp = rs
  } else {
    console.error('【handleResp】找不到匹配的request');
  }
  
  noticeApiUpdate('replace', rs)
  return rs
}

export function connectApiSnippet(matcher: string, snippetId: string) {
  apiSnippetPair.push([
    // 正则反序列化，需要替换前后'/'
    (url) => RegExp(matcher.slice(1, matcher.length - 1)).test(url), 
    snippetId
  ])
}

export function getApiHistory(): ApiRecord[] {
  return apiRecords
}

export function clearApiHistory () {
  apiRecords = []
  noticeApiUpdate('clear')
}