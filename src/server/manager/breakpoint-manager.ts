import { concat, isEmpty, pipe, pullAllBy } from 'lodash/fp';

import { API_DATA_TYPE, BreakPoint, SOCKET_MSG_TAG_API } from '../../lib/interface';
import ss from '../socket-server';

let BPS: Array<BreakPoint> = []

ss.on(SOCKET_MSG_TAG_API.GET_BREAKPOINTS, (cb) => {
  cb(BPS)
})

ss.on(
  SOCKET_MSG_TAG_API.UPDATE_BREAKPOINT_BY_URL,
  (url: string, enableTypes: API_DATA_TYPE[]) => {
    BPS = pipe(
      pullAllBy('url', [{ url }]),
      concat(enableTypes.map((type) => ({ type, url })))
    )(BPS)
    
    ss.broadcast(SOCKET_MSG_TAG_API.UPDATE_BREAKPOINTS, BPS)
  }
)

export async function throughBP4Req(req: object) {
  console.log('------th req--------');
}
export async function throughBP4Resp(resp: object, body: object) {
  console.log('------th resp-------', BPS);
  if (!isEmpty(BPS)) {
    const data = await ss.once('breakpoint-tamper-reponse')
    return JSON.parse(data.code);
  }
  return body
}