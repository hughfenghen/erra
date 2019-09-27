import { ApiRecord, API_DATA_TYPE, SOCKET_MSG_TAG_API, SimpleReq, SimpleResp, BPMsg } from '../../lib/interface';
import ss from '../socket-server';
import { replaceRecord } from './api-manager';
import configManager from './config-manager';
import { parseSnippetContent } from './snippet-manager';
import { isEmpty, pull } from 'lodash/fp';

const BPS: { [key: string]: API_DATA_TYPE[] } = {}

class BPMsgQueue {
  private queue: [BPMsg, Function][] = []
  private awaiting = false

  push<T>(msg: BPMsg): Promise<T> {
    return new Promise((resolve) => {
      this.queue.push([msg, resolve])
      this.consumer()
    })
  }

  private async consumer() {
    if (this.awaiting || isEmpty(this.queue)) return

    const [msg, resolve] = this.queue.shift()
    let data = msg.httpDetail
    try {
      this.awaiting = true
      ss.broadcast(SOCKET_MSG_TAG_API.BP_START, msg)
      // 携带id type使得socketIO消息tag是唯一的，不用考虑网络先后顺序
      data = await ss.once(SOCKET_MSG_TAG_API.BP_DONE + msg.uuid + msg.bpType)
      // 递归进行下一个断点
      this.awaiting = false
    } catch (e) {
      console.error(e);
    }
    resolve(data)
    this.consumer()
  }

  // 用户移除断点，释放队列中所有阻塞的断点
  releaseMsg(bpKey: string, bpTypes: API_DATA_TYPE[]) {
    // 断点配置变化，从队列中 找到需要放行的消息
    // 更新后的断点类型中，不包含队列消息中的断点，判定为需要放行的消息
    const msgs = this.queue.filter(([msg]) => (msg.bpKey === bpKey && !bpTypes.includes(msg.bpType)))
    if (isEmpty(msgs)) return

    msgs.forEach(([{ httpDetail }, resolve]) => {
      // 按添加消息的数据返回，不做修改
      resolve(httpDetail)
    })
    const msgIds = msgs.map(([m]) => m.uuid)
    // @ts-ignore
    this.queue = this.queue.filter(([m]) => !msgIds.includes(m.uuid))
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
    bpMsgQueue.releaseMsg(key, enableTypes)
  }
)

ss.on(SOCKET_MSG_TAG_API.BP_QUEUE, () => {
  
})

export async function throughBP4Req(record: ApiRecord): Promise<ApiRecord> {
  const { req, parsedUrl, uuid } = record

  if ((BPS[parsedUrl.shortHref] || []).includes(API_DATA_TYPE.REQUEST)) {
    // 放入断点消息队列，逐个通知客户端，弹出窗编辑框
    const mHttpDetail = await bpMsgQueue.push<SimpleReq>({
      uuid,
      bpKey: parsedUrl.shortHref,
      bpType: API_DATA_TYPE.REQUEST,
      httpDetail: req
    })

    const newRecord = { ...record, req: mHttpDetail }
    // 修改后的数据 同步到客户端
    replaceRecord(newRecord)
    return newRecord;
  }

  return record
}

export async function throughBP4Resp(record: ApiRecord): Promise<ApiRecord> {
  const { resp, parsedUrl, uuid } = record

  if ((BPS[parsedUrl.shortHref] || []).includes(API_DATA_TYPE.RESPONSE)) {
    // 放入断点消息队列，逐个通知客户端，弹出窗编辑框
    const mHttpDetail = await bpMsgQueue.push<SimpleReq>({
      uuid,
      bpKey: parsedUrl.shortHref,
      bpType: API_DATA_TYPE.RESPONSE,
      httpDetail: resp
    })

    const newRecord = Object.assign(
      {},
      record,
      // 断点的时候 支持用户输入 snippet
      { resp: parseSnippetContent(mHttpDetail)(resp) }
    )

    replaceRecord(newRecord)

    return newRecord;
  }

  return record
}