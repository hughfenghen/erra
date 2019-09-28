import { ApiRecord, API_DATA_TYPE, SOCKET_MSG_TAG_API, SimpleReq, SimpleResp, BPMsg } from '../../lib/interface';
import ss from '../socket-server';
import { replaceRecord } from './api-manager';
import configManager from './config-manager';
import { parseSnippetContent } from './snippet-manager';
import { find, isEmpty, map, pullAll, omit, pull } from 'lodash/fp';

const BPS: { [key: string]: API_DATA_TYPE[] } = {}

class BPMsgQueue {
  private queue: BPMsg[] = []
  private awaiting = false

  push<T>(record: ApiRecord): Promise<T> {
    return new Promise((resolve) => {
      const { uuid, req, resp, parsedUrl } = record
      this.queue.push({
        uuid,
        method: req.method,
        parsedUrl,
        // resp有值，说明当前是一个RESPONSE断点
        type: resp ? API_DATA_TYPE.RESPONSE : API_DATA_TYPE.REQUEST,
        httpDetail: resp || req,
        resolve,
      })
      // this.consumer()
    })
  }

  // private async consumer() {
  //   if (this.awaiting || isEmpty(this.queue)) return

  //   const [msg, resolve] = this.queue.shift()
  //   let data = msg.httpDetail
  //   try {
  //     this.awaiting = true
  //     ss.broadcast(SOCKET_MSG_TAG_API.BP_START, msg)
  //     // 携带id type使得socketIO消息tag是唯一的，不用考虑网络先后顺序
  //     data = await ss.once(SOCKET_MSG_TAG_API.BP_DONE + msg.uuid + msg.bpType)
  //     // 递归进行下一个断点
  //     this.awaiting = false
  //   } catch (e) {
  //     console.error(e);
  //   }
  //   resolve(data)
  //   this.consumer()
  // }

  // 用户移除断点，释放队列中所有阻塞的断点
  releaseMsg(bpKey: string, bpTypes: API_DATA_TYPE[]) {
    // 断点配置变化，从队列中 找到需要放行的消息
    // 更新后的断点类型中，不包含队列消息中的断点，判定为需要放行的消息
    const releaseMsgs = this.queue.filter((msg) => (msg.parsedUrl.shortHref === bpKey && !bpTypes.includes(msg.type)))
    if (isEmpty(releaseMsgs)) return

    releaseMsgs.forEach(({ httpDetail, resolve }) => {
      // 按添加消息的数据返回，不做修改
      resolve(httpDetail)
    })
    // @ts-ignore
    this.queue = pullAll(releaseMsgs, this.queue)
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

ss.on(SOCKET_MSG_TAG_API.BP_GET_QUEUE_MSGS, (cb) => {
  cb(bpMsgQueue.getQueueMsgs())
})

ss.on(SOCKET_MSG_TAG_API.BP_START, (uuid, cb) => {
  cb(bpMsgQueue.getMsg(uuid))
})

ss.on(SOCKET_MSG_TAG_API.BP_DONE, (uuid, httpDetail) => {
  bpMsgQueue.passBPMsg(uuid, httpDetail)
})

ss.on(SOCKET_MSG_TAG_API.BP_PASS_ALL, () => {
  bpMsgQueue.passAll()
})

export async function throughBP4Req(record: ApiRecord): Promise<ApiRecord> {
  const { req, parsedUrl, uuid } = record

  if ((BPS[parsedUrl.shortHref] || []).includes(API_DATA_TYPE.REQUEST)) {
    // 放入断点消息队列，逐个通知客户端，弹出窗编辑框
    const mHttpDetail = await bpMsgQueue.push<SimpleReq>(record)

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
    const mHttpDetail = await bpMsgQueue.push<SimpleReq>(record)

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