import { ApiRecord, API_DATA_TYPE, SOCKET_MSG_TAG_API } from '../../lib/interface';
import ss from '../socket-server';
import { replaceRecord } from './api-manager';
import configManager from './config-manager';
import { parseSnippetContent } from './snippet-manager';
import { isEmpty } from 'lodash/fp';


const BPS: { [key: string]: API_DATA_TYPE[] } = {}

configManager.on('afterConfigInit', () => {
  Object.assign(BPS, {
    ...(configManager.get(configManager.key.BREAKPOINT) || {})
  })
})

ss.on(SOCKET_MSG_TAG_API.BP_GET, (cb) => {
  cb(BPS)
})

ss.on(
  SOCKET_MSG_TAG_API.BP_UPDATE_BY_URL,
  (key: string, enableTypes: API_DATA_TYPE[]) => {
    if (isEmpty(enableTypes)) {
      delete BPS[key]
    } else {
      BPS[key] = enableTypes
    }

    configManager.emit('update', configManager.key.BREAKPOINT, BPS)
    ss.broadcast(SOCKET_MSG_TAG_API.BP_UPDATE, BPS)
  }
)

export async function throughBP4Req(record: ApiRecord): Promise<ApiRecord> {
  const { req, parsedUrl } = record

  if ((BPS[parsedUrl.shortHref] || []).includes(API_DATA_TYPE.REQUEST)) {
    // 通知客户端，弹窗编辑框
    ss.broadcast(SOCKET_MSG_TAG_API.BP_START, req)
    // 等待UI界面修改resp
    const data = await ss.once(SOCKET_MSG_TAG_API.BP_DONE)
    const newRecord = { ...record, req: data }
    // 修改后的数据 同步到客户端
    replaceRecord(newRecord)
    return newRecord;
  }

  return record
}

export async function throughBP4Resp(record: ApiRecord): Promise<ApiRecord> {
  const { resp, parsedUrl } = record

  if ((BPS[parsedUrl.shortHref] || []).includes(API_DATA_TYPE.RESPONSE)) {
    // 通知客户端，弹窗编辑框
    ss.broadcast(SOCKET_MSG_TAG_API.BP_START, resp)
    // 等待UI界面修改resp
    const data = await ss.once(SOCKET_MSG_TAG_API.BP_DONE)
    const newRecord = Object.assign(
      {},
      record,
      // 断点的时候 支持用户输入 snippet
      { resp: parseSnippetContent(data)(resp) }
    )

    replaceRecord(newRecord)

    return newRecord;
  }

  return record
}