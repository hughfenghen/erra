import yaml from 'js-yaml';
import { find, isEmpty, map, omit, pull } from 'lodash/fp';
import { ApiRecord, API_DATA_TYPE, BPMsg, SimpleReq, SOCKET_MSG_TAG_API } from '../../lib/interface';
import ss from '../socket-server';
import { replaceRecord } from './api-manager';
import configManager from './config-manager';
import { parseSnippetContent } from './snippet-manager';

const BPS: { [key: string]: API_DATA_TYPE[] } = {}

class BPMsgQueue {
  private queue: BPMsg[] = []
  enabled = true

  push<T>(record: ApiRecord): Promise<T> {
    if (!this.enabled) {
      return Promise.resolve(<T><unknown>(record.resp || record.req))
    }
    return new Promise((resolve, reject) => {
      const { uuid, req, resp, parsedUrl } = record
      const msg = {
        uuid,
        method: req.method,
        parsedUrl,
        // resp有值，说明当前是一个RESPONSE断点
        type: resp ? API_DATA_TYPE.RESPONSE : API_DATA_TYPE.REQUEST,
        httpDetail: resp || req,
        resolve,
        reject,
      }
      this.queue.push(msg)

      ss.broadcast(SOCKET_MSG_TAG_API.BP_MSG_NEW, omit('httpDetail', msg))
    })
  }

  getQueueMsgs() {
    // 避免内容过大移除断点中的详情
    return map(omit(['httpDetail', 'resolve']))(this.queue)
  }

  getMsg(uuid: string): BPMsg {
    return find({ uuid }, this.queue)
  }

  passBPMsg(uuid, httpDetail?) {
    const msg = this.getMsg(uuid)
    if (!msg) return
    // 如果未传值相当于直接点击【跳过】，使用原值
    msg.resolve(httpDetail || msg.httpDetail)
    this.queue = pull(msg, this.queue)
  }

  passAll() {
    this.queue.forEach((msg) => {
      msg.resolve(msg.httpDetail)
    })
    this.queue = []
  }

  abortMSg(uuid) {
    const msg = <BPMsg>find({ uuid }, this.queue)
    if (!msg) return
    msg.reject(new Error('请求被中断：' + msg.parsedUrl.shortHref))
  }
};

// 断点消息队列
const bpMsgQueue = new BPMsgQueue()

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

ss.on(SOCKET_MSG_TAG_API.BP_MSG_GET_QUEUE, (cb) => {
  cb(bpMsgQueue.getQueueMsgs())
})

ss.on(SOCKET_MSG_TAG_API.BP_MSG_START, (uuid, cb) => {
  cb(bpMsgQueue.getMsg(uuid))
})

ss.on(SOCKET_MSG_TAG_API.BP_MSG_ABORT, (uuid) => {
  bpMsgQueue.abortMSg(uuid)
  ss.broadcast(SOCKET_MSG_TAG_API.BP_MSG_REMOVE, uuid)
})

ss.on(SOCKET_MSG_TAG_API.BP_MSG_DONE, ({ id, code }) => {
  bpMsgQueue.passBPMsg(id, code && yaml.load(code))
  ss.broadcast(SOCKET_MSG_TAG_API.BP_MSG_REMOVE, id)
})

ss.on(SOCKET_MSG_TAG_API.BP_MSG_PASS_ALL, () => {
  bpMsgQueue.passAll()
  ss.broadcast(SOCKET_MSG_TAG_API.BP_MSG_REMOVE, 'all')
})

ss.on(SOCKET_MSG_TAG_API.BP_MSG_ENABLED, (cb) => {
  cb(bpMsgQueue.enabled)
})

ss.on(SOCKET_MSG_TAG_API.BP_MSG_SET_ENABLED, (val) => {
  bpMsgQueue.enabled = val
  ss.broadcast(SOCKET_MSG_TAG_API.BP_MSG_SET_ENABLED, val)
})

export async function throughBP4Req(record: ApiRecord): Promise<ApiRecord> {
  const { parsedUrl } = record
  let rsRecord = record

  if ((BPS[parsedUrl.shortHref] || []).includes(API_DATA_TYPE.REQUEST)) {
    try {
      // 放入断点消息队列
      const mHttpDetail = await bpMsgQueue.push<SimpleReq>(record)

      rsRecord = await { ...record, req: mHttpDetail }
      // 修改后的数据 同步到客户端
      replaceRecord(rsRecord)
    } catch (err) {
      rsRecord.resp = {
        statusCode: 500,
        headers: {},
        body: err.message,
      }
      replaceRecord(rsRecord)
      throw err
    }
    return rsRecord;
  }

  return record
}

export async function throughBP4Resp(record: ApiRecord): Promise<ApiRecord> {
  const { resp, parsedUrl } = record
  let rsRecord = record

  if ((BPS[parsedUrl.shortHref] || []).includes(API_DATA_TYPE.RESPONSE)) {
    try {
      // 放入断点消息队列，由队列管理消息
      const mHttpDetail = await bpMsgQueue.push<SimpleReq>(record)

      rsRecord = Object.assign(
        {},
        record,
        // 断点的时候 支持用户输入 snippet
        { resp: parseSnippetContent(mHttpDetail)(resp) }
      )
      replaceRecord(rsRecord)
    } catch (err) {
      rsRecord.resp.body = err.message
      replaceRecord(rsRecord)
      throw err
    }

    return rsRecord;
  }

  return record
}