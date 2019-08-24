import { find } from 'lodash/fp';
import genUUID from 'uuid';

import { ApiRecord, SimpleReq, SimpleResp, SOCKET_MSG_TAG_API } from '../../lib/interface';
import ss from '../socket-server';
import configManager from './config-manager';
import { getSnippet } from './snippet-manager';


function noticeApiUpdate(tag: string, content = {}) {
  ss.broadcast(tag, content)
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

ss.on(SOCKET_MSG_TAG_API.GET_HISTORY, (cb) => {
  cb(apiRecords)
})

ss.on(SOCKET_MSG_TAG_API.CLEAR_RECORD, () => {
  clearApiHistory()
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
  noticeApiUpdate(SOCKET_MSG_TAG_API.NEW_RECORD, record)

  return record
}

export function handleResp(resp: SimpleResp, req: SimpleReq): ApiRecord {
  const snippetId = (apiSnippetPair.find(([match]) => match(req.url)) || [])[1]
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
  noticeApiUpdate(SOCKET_MSG_TAG_API.REPLACE_RECORD, newRecord)
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

export function clearApiHistory() {
  apiRecords = []
  ss.broadcast(SOCKET_MSG_TAG_API.UPDATE_RECORD, [])
}