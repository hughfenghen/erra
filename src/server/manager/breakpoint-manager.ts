import { concat, find, pipe, pullAllBy } from 'lodash/fp';

import { API_DATA_TYPE, ApiRecord, BreakPoint, SOCKET_MSG_TAG_API } from '../../lib/interface';
import ss from '../socket-server';
import { replaceRecord } from './api-manager';
import { parseSnippetContent } from './snippet-manager';
import configManager from './config-manager';

let BPS: BreakPoint[] = []

configManager.on('afterConfigInit', () => {
  BPS = configManager.get(configManager.key.BREAKPOINT) || []
})

ss.on(SOCKET_MSG_TAG_API.BP_GET, (cb) => {
  cb(BPS)
})

ss.on(
  SOCKET_MSG_TAG_API.BP_UPDATE_BY_URL,
  (url: string, enableTypes: API_DATA_TYPE[]) => {
    BPS = pipe(
      pullAllBy('url', [{ url }]),
      concat(enableTypes.map((type) => ({ type, url })))
    )(BPS)
    
    configManager.emit('update', configManager.key.BREAKPOINT, BPS)
    ss.broadcast(SOCKET_MSG_TAG_API.BP_UPDATE, BPS)
  }
)

export async function throughBP4Req(record: ApiRecord): Promise<ApiRecord> {
  const { req, uuid } = record

  if (find({ url: req.url, type: API_DATA_TYPE.REQUEST })(BPS)) {
    // 通知客户端，弹窗编辑框
    ss.broadcast(SOCKET_MSG_TAG_API.BP_START, req)
    // 等待UI界面修改resp
    const data = await ss.once(SOCKET_MSG_TAG_API.BP_DONE)
    const newRecord = { uuid, req: data }
    // 修改后的数据 同步到客户端
    replaceRecord(newRecord)
    return newRecord;
  }
  
  return record
}

export async function throughBP4Resp(record: ApiRecord): Promise<ApiRecord> {
  const { resp } = record
  
  if (find({ url: resp.url, type: API_DATA_TYPE.RESPONSE })(BPS)) {
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