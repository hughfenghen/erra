import genUUID from 'uuid';
import { fromPairs, mergeAll, map, prop, pipe, tap } from 'lodash/fp';
import { ApiRecord, SOCKET_MSG_TAG_API, API_DATA_TYPE, SimpleReq } from '../../../lib/interface';
import ss from '../../socket-server';
import { throughBP4Req, throughBP4Resp } from '../breakpoint-manager';
import { parseUrl4Req } from '../../../lib/utils';
import { handleReq, handleResp } from '../api-manager';


jest.mock('../../socket-server')
jest.mock('uuid');

function createRecord(url) {
  const uuid = genUUID()
  const req: SimpleReq = {
    __erra_uuid__: uuid,
    url,
    headers: {},
    method: 'POST',
  }
  const recordTpl: ApiRecord = {
    req,
    parsedUrl: parseUrl4Req(req),
    uuid,
    resp: {
      statusCode: 200,
      headers: {},
    },
  }
  return recordTpl
}

test('api req断点按队列顺序进行', (done) => {
  const url = 'http://erra.io/test'
  const onBPUpdate = pipe(
    fromPairs,
    prop(SOCKET_MSG_TAG_API.BP_UPDATE_BY_URL)
    // @ts-ignore
  )(ss.on.mock.calls);

  const spyOnce = jest.spyOn(ss, 'once')
  let firtBPResove = null
  spyOnce.mockReturnValueOnce(new Promise((resolve) => {
    firtBPResove = resolve
  }))

  // 添加一个断点
  onBPUpdate(url, [API_DATA_TYPE.REQUEST])

  // @ts-ignore 清空update调用的broadcast
  ss.broadcast.mockReset()
  // 模拟同时收到两个断点
  const r1 = createRecord(url)
  handleReq(r1.req)
  throughBP4Req(r1)

  const r2 = createRecord(url)
  handleReq(r2.req)
  throughBP4Req(r2)

  expect(ss.broadcast).toBeCalledWith(
    SOCKET_MSG_TAG_API.BP_START,
    r1.uuid,
    r1.req
  )
  expect(
    ss.broadcast
      // @ts-ignore
      .mock
      .calls
      .filter(([msgTag]) => msgTag === SOCKET_MSG_TAG_API.BP_START).length
  ).toBe(1)
  // 第一个断点结束后
  firtBPResove()
  setTimeout(function () {
    // 再按开始下一个断点
    expect(ss.broadcast).toBeCalledWith(
      SOCKET_MSG_TAG_API.BP_START,
      r2.uuid,
      r2.req
    )
    expect(
      ss.broadcast
        // @ts-ignore
        .mock
        .calls
        .filter(([msgTag]) => msgTag === SOCKET_MSG_TAG_API.BP_START).length
    ).toBe(2)
    done()
  }, 1);
})

test('api resp断点按队列顺序进行', (done) => {
  const url = 'http://erra.io/test'
  const onBPUpdate = pipe(
    fromPairs,
    prop(SOCKET_MSG_TAG_API.BP_UPDATE_BY_URL)
    // @ts-ignore
  )(ss.on.mock.calls);

  const spyOnce = jest.spyOn(ss, 'once')
  let firtBPResove = null
  spyOnce.mockReturnValueOnce(new Promise((resolve) => {
    firtBPResove = resolve
  }))

  // 添加一个断点
  onBPUpdate(url, [API_DATA_TYPE.RESPONSE])

  // @ts-ignore 清空update调用的broadcast
  ss.broadcast.mockReset()
  // 模拟同时收到两个断点
  const r1 = createRecord(url)
  handleReq(r1.req)
  handleResp(r1.resp, r1.req)
  throughBP4Resp(r1)

  const r2 = createRecord(url)
  handleReq(r2.req)
  handleResp(r2.resp, r2.req)
  throughBP4Resp(r2)

  expect(ss.broadcast).toBeCalledWith(
    SOCKET_MSG_TAG_API.BP_START,
    r1.uuid,
    r1.resp
  )
  expect(
    ss.broadcast
      // @ts-ignore
      .mock
      .calls
      .filter(([msgTag]) => msgTag === SOCKET_MSG_TAG_API.BP_START).length
  ).toBe(1)
  // 第一个断点结束后
  firtBPResove()
  setTimeout(function () {
    // 再按开始下一个断点
    expect(ss.broadcast).toBeCalledWith(
      SOCKET_MSG_TAG_API.BP_START,
      r2.uuid,
      r2.resp
    )
    expect(
      ss.broadcast
        // @ts-ignore
        .mock
        .calls
        .filter(([msgTag]) => msgTag === SOCKET_MSG_TAG_API.BP_START).length
    ).toBe(2)
    done()
  }, 1);
})