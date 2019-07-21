import { isEmpty } from 'lodash/fp';
import { sleep } from './utils';
import { listenOnline } from './socket-server';

type BPType = 'request' | 'response'
interface BreakPoint {
  type: BPType,
  match: RegExp,
  enabled: boolean,
}

let BPS: Array<BreakPoint> = []

export function enableBreakpoint (url: string, type: BPType) {
  BPS.push({
    type,
    // match: new RegExp(`^${url}$`),
    match: new RegExp(`${url}`),
    enabled: true,
  })
}

export function disableBreakpoint(url: string, type: BPType) {
  BPS = BPS.filter((it) => !it.match.test(url) || it.type !== type)
}

export async function throughBP4Req(req: object) {
  console.log('------th req--------');
}
export async function throughBP4Resp(resp: object, body: object) {
  console.log('------th resp-------', BPS);
  if (!isEmpty(BPS)) {
    const data = await listenOnline('breakpoint-tamper-reponse')
    console.log(44444, data);
    return JSON.parse(data.code);
  }
  return body
}