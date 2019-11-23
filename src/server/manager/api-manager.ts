import { find, omit, isString } from 'lodash/fp';
import genUUID from 'uuid';

import { ApiRecord, SimpleReq, SimpleResp, SOCKET_MSG_TAG_API } from '../../lib/interface';
import ss from '../socket-server';
import configManager from './config-manager';
import { getSnippetFn, matchedSnippetFns } from './snippet-manager';
import { parseUrl4Req, isTextResp } from '../../lib/utils';

const apiSnippetPair: { [x: string]: string } = {}
let apiRecords: ApiRecord[] = []
let recordingEenabled = true

configManager.on('afterConfigInit', () => {
  Object.entries(configManager.get(configManager.key.API_BIND_SNIPPET) || {})
    .forEach(([matcher, snippetId]) => {
      bindApiSnippet(matcher, String(snippetId))
    })
})

ss.on(SOCKET_MSG_TAG_API.API_GET_HISTORY, (cb) => {
  // 默认不传递body、headers，避免页面卡顿
  cb(apiRecords.map(({ uuid, parsedUrl, req, resp }) => ({
    uuid,
    req: omit(['body', 'headers'], req),
    resp: omit(['body', 'headers'], resp),
    parsedUrl,
  })))
})

ss.on(SOCKET_MSG_TAG_API.API_GET_RECORD_DETAIL, (uuid, cb) => {
  cb(find({ uuid }, apiRecords))
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

ss.on(SOCKET_MSG_TAG_API.API_ENABLED, (cb) => {
  cb(recordingEenabled)
})

ss.on(SOCKET_MSG_TAG_API.API_SET_ENABLED, (val) => {
  recordingEenabled = !!val
  ss.broadcast(SOCKET_MSG_TAG_API.API_SET_ENABLED, recordingEenabled)
})

/**
 * 生成一条api请求记录
 * @param req SimpleReq
 */
export function handleReq(req: SimpleReq): ApiRecord | null {
  if (!recordingEenabled) return null
  // todo: 支持formData, body file
  const { headers, url, method } = req
  const uuid = genUUID()
  const record = {
    uuid,
    req: { 
      headers, 
      url, 
      method,
      __erra_uuid__: uuid,
    },
    parsedUrl: parseUrl4Req(req),
  }

  matchedSnippetFns(record)
    .forEach((sfn) => {
      record.req = sfn(record.req);
    })

  apiRecords.unshift(record)
  ss.broadcast(SOCKET_MSG_TAG_API.API_NEW_RECORD, record)
  if (apiRecords.length > 200) {
    const delIt = apiRecords.pop()
    ss.broadcast(SOCKET_MSG_TAG_API.API_DEL_RECORD, delIt.uuid)
  }

  return record
}

/**
 * 关联Resp与req，产生一条完整的ApiRecord
 * @param resp SimpleResp
 * @param req SimpleReq
 */
export function handleResp(resp: SimpleResp, req: SimpleReq): ApiRecord | null {
  if (!recordingEenabled) return

  const record = <ApiRecord>find({ uuid: req.__erra_uuid__ }, apiRecords)
  if (record == null) {
    console.warn(`【handleResp】找不到匹配的request，url: ${req.url}`);
    return null
  }

  let rs = resp
  matchedSnippetFns({ ...record, resp })
    .forEach((sfn) => {
      rs = sfn(rs);
    })

  const snippetId = apiSnippetPair[record.parsedUrl.shortHref]
  
  rs = snippetId ? getSnippetFn(snippetId)(rs) : rs

  let recordBody = rs.body
  // 非文本时，编辑其中的内容用占位符代替
  if (!isTextResp(rs)) {
    recordBody = '<non text>'
  } if (isString(rs.body) && rs.body.length > 1e5) {
    // 避免Response太长，导致浏览器卡死，超过10w长度则替换
    recordBody = '<long long string>'
  }

  replaceRecord({
    ...record,
    resp: {
      ...rs,
      body: recordBody,
    }
  })

  return {
    ...record,
    resp: rs,
  }
}

export function replaceRecord(record: ApiRecord) {
  const oldRecord = <ApiRecord>find({ uuid: record.uuid })(apiRecords)
  if (!oldRecord) throw new Error('找不到需要替换的record');

  const newRecord = Object.assign(oldRecord, record)
  ss.broadcast(SOCKET_MSG_TAG_API.API_REPLACE_RECORD, newRecord)
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