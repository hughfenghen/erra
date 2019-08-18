import { concat, find, pipe, pullAllBy } from 'lodash/fp';

import { API_DATA_TYPE, BreakPoint, SimpleResp, SOCKET_MSG_TAG_API } from '../../lib/interface';
import ss from '../socket-server';

let BPS: BreakPoint[] = []

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
    
    ss.broadcast(SOCKET_MSG_TAG_API.BP_UPDATE, BPS)
  }
)

export async function throughBP4Req(req: object) {
  console.log('------th req--------');
}

export async function throughBP4Resp(resp: SimpleResp) {
  console.log('------th resp-------', BPS);
  if (find({ url: resp.url, type: API_DATA_TYPE.RESPONSE })(BPS)) {
    // 通知客户端，弹窗编辑框
    ss.broadcast(SOCKET_MSG_TAG_API.BP_RESP_START, resp)
    // 等待UI界面修改resp
    const data = await ss.once(SOCKET_MSG_TAG_API.BP_RESP_DONE)
    return data;
  }
  return resp
}