import { find } from 'lodash/fp';
import genUUID from 'uuid';

import { ApiRecord, SimpleReq, SimpleResp, SOCKET_MSG_TAG_API } from '../../lib/interface';
import ss from '../socket-server';
import configManager from './config-manager';
import { getSnippet } from './snippet-manager';


function noticeApiUpdate(tag: string, content = {}) {
  ss.broadcast(tag, content)
}

const apiSnippetPair: { [x: string]: string } = {}
let apiRecords: ApiRecord[] = []

configManager.on('afterConfigInit', () => {
  // todo init apiSnippetPair
  Object.entries(configManager.get('api-match-snippet') || {})
    .forEach(([matcher, snippetId]) => {
      bindApiSnippet(matcher, String(snippetId))
    })
})

ss.on(SOCKET_MSG_TAG_API.API_GET_HISTORY, (cb) => {
  cb(apiRecords)
})

ss.on(SOCKET_MSG_TAG_API.API_CLEAR_RECORD, () => {
  clearApiHistory()
})

ss.on(SOCKET_MSG_TAG_API.API_GET_SNIPPET_RELATION, (cb) => {
  cb(apiSnippetPair)
})

ss.on(SOCKET_MSG_TAG_API.API_BIND_SNIPPET, (url, snippetId) => {
  bindApiSnippet(url, snippetId)
  configManager.emit(
    'update', 
    configManager.key.API_BIND_SNIPPET, 
    apiSnippetPair
  )
  ss.broadcast(SOCKET_MSG_TAG_API.API_UPDATE_SNIPPET_RELATION, apiSnippetPair)
})

export function handleReq(req): ApiRecord {
  // todo: cookie, formData, body 
  const { headers, url, method } = req
  const record = {
    uuid: genUUID(),
    req: { headers, url, method },
  }
  req._erra_uuid = record.uuid
  apiRecords.push(record)
  noticeApiUpdate(SOCKET_MSG_TAG_API.API_NEW_RECORD, record)

  return record
}

export function handleResp(resp: SimpleResp, req: SimpleReq): ApiRecord {
  const snippetId = apiSnippetPair[req.url]
  const rs = snippetId ? getSnippet(snippetId)(resp) : resp

  const record = <ApiRecord>find({ uuid: req._erra_uuid }, apiRecords)

  if (record == null) {
    console.warn(`【handleResp】找不到匹配的request，url: ${req.url}`);
    return null
  }

  record.resp = rs
  replaceRecord(record)

  return record
}

export function replaceRecord(record: ApiRecord) {
  const oldRecord = <ApiRecord>find({ uuid: record.uuid })(apiRecords)
  if (!oldRecord) throw new Error('找不到需要替换的record');

  const newRecord = Object.assign(oldRecord, record)
  noticeApiUpdate(SOCKET_MSG_TAG_API.API_REPLACE_RECORD, newRecord)
}

export function bindApiSnippet(url: string, snippetId: string) {
  if (snippetId) apiSnippetPair[url] = snippetId
  else delete apiSnippetPair[url]
}

export function getApiHistory(): ApiRecord[] {
  return apiRecords
}

export function clearApiHistory() {
  apiRecords = []
  ss.broadcast(SOCKET_MSG_TAG_API.API_UPDATE_RECORD, [])
}