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


// 添加一个断点
function addBP(bpKey, bpType) {
  const onBPUpdate = pipe(
    fromPairs,
    prop(SOCKET_MSG_TAG_API.BP_UPDATE_BY_URL)
    // @ts-ignore
  )(ss.on.mock.calls);

  onBPUpdate(bpKey, [bpType])

  const spyOnce = jest.spyOn(ss, 'once')
  let bpResolve = null
  spyOnce.mockReturnValueOnce(new Promise((resolve) => {
    bpResolve = resolve
  }))

  return bpResolve
}

// 模拟一个请求 命中断点
function hitBP(bpKey, bpType) {
  const record = createRecord(bpKey)
  // 生成随机数作为每条record的指纹
  record.req.headers['x-random'] = String(Math.random())

  handleReq(record.req)
  if (bpType === API_DATA_TYPE.REQUEST) {
    throughBP4Req(record)
  } else if (bpType === API_DATA_TYPE.RESPONSE) {
    handleResp(record.resp, record.req)
    throughBP4Resp(record)
  } else {
    throw new Error('参数错误：bpType')
  }

  return record
}

test('获取断点队列', () => {

})

test('处理断点任务', () => {

})

test('跳过一个断点任务', () => {

})

test('跳过所有断点任务', () => {

})

test('api req断点按队列顺序进行', (done) => {
  const url = 'http://erra.io/test'
  const firtBPResolve = addBP(url, API_DATA_TYPE.REQUEST)

  // @ts-ignore 清空update调用的broadcast
  ss.broadcast.mockReset()
  // 模拟同时收到两个断点
  const r1 = hitBP(url, API_DATA_TYPE.REQUEST)
  const r2 = hitBP(url, API_DATA_TYPE.REQUEST)

  let calledArgsGroup = ss.broadcast
    // @ts-ignore
    .mock
    .calls
    .filter(([msgTag]) => msgTag === SOCKET_MSG_TAG_API.BP_START)

  expect(calledArgsGroup.length).toBe(1)

  let firstCalledArgs = calledArgsGroup[0]
  expect(firstCalledArgs[0]).toBe(SOCKET_MSG_TAG_API.BP_START)
  expect(firstCalledArgs[1].httpDetail).toEqual(r1.req)

  // 第一个断点结束后
  firtBPResolve()
  setTimeout(function () {
    // 再开始下一个断点
    calledArgsGroup = ss.broadcast
      // @ts-ignore
      .mock
      .calls
      .filter(([msgTag]) => msgTag === SOCKET_MSG_TAG_API.BP_START)
    expect(calledArgsGroup.length).toBe(2)

    let secondCalledArgs = calledArgsGroup[1]
    expect(secondCalledArgs[0]).toBe(SOCKET_MSG_TAG_API.BP_START)
    expect(secondCalledArgs[1].httpDetail).toEqual(r2.req)

    done()
  }, 1);
})

test('api resp断点按队列顺序进行', (done) => {
  const url = 'http://erra.io/test'
  const firtBPResolve = addBP(url, API_DATA_TYPE.RESPONSE)

  // @ts-ignore 清空update调用的broadcast
  ss.broadcast.mockReset()
  // 模拟同时收到两个断点
  const r1 = hitBP(url, API_DATA_TYPE.RESPONSE)
  const r2 = hitBP(url, API_DATA_TYPE.RESPONSE)

  let calledArgsGroup = ss.broadcast
    // @ts-ignore
    .mock
    .calls
    .filter(([msgTag]) => msgTag === SOCKET_MSG_TAG_API.BP_START)

  expect(calledArgsGroup.length).toBe(1)

  let firstCalledArgs = calledArgsGroup[0]
  expect(firstCalledArgs[0]).toBe(SOCKET_MSG_TAG_API.BP_START)
  expect(firstCalledArgs[1].httpDetail).toEqual(r1.resp)

  // 第一个断点结束后
  firtBPResolve()
  setTimeout(function () {
    // 再开始下一个断点
    calledArgsGroup = ss.broadcast
      // @ts-ignore
      .mock
      .calls
      .filter(([msgTag]) => msgTag === SOCKET_MSG_TAG_API.BP_START)
    expect(calledArgsGroup.length).toBe(2)

    let secondCalledArgs = calledArgsGroup[1]
    expect(secondCalledArgs[0]).toBe(SOCKET_MSG_TAG_API.BP_START)
    expect(secondCalledArgs[1].httpDetail).toEqual(r2.resp)

    done()
  }, 1);
})
