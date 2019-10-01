import { fromPairs, pipe, prop } from 'lodash/fp';
import genUUID from 'uuid';
import { ApiRecord, API_DATA_TYPE, SimpleReq, SOCKET_MSG_TAG_API } from '../../../lib/interface';
import { parseUrl4Req } from '../../../lib/utils';
import ss from '../../socket-server';
import { handleReq, handleResp } from '../api-manager';
import { throughBP4Req, throughBP4Resp } from '../breakpoint-manager';


jest.mock('../../socket-server')
jest.mock('uuid');
genUUID.mockReturnValue('mock_uuid')

afterEach(() => { passAllMsgs() })

function passAllMsgs() {
  const onPassAll = pipe(
    fromPairs,
    prop(SOCKET_MSG_TAG_API.BP_MSG_PASS_ALL),
    // @ts-ignore
  )(ss.on.mock.calls);
  // 每个用例前清空断点消息队列
  onPassAll()
}

function createRecord(url, dataType) {
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
    resp: dataType === API_DATA_TYPE.RESPONSE ? {
      statusCode: 200,
      headers: {},
    } : undefined,
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

  onBPUpdate(bpKey, [].concat(bpType))
}

// 模拟一个请求 命中断点
function hitBP(bpKey, bpType) {
  const record = createRecord(bpKey, bpType)
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

function getQueueMsgs() {
  const onGetQueueMsg = pipe(
    fromPairs,
    prop(SOCKET_MSG_TAG_API.BP_MSG_GET_QUEUE)
    // @ts-ignore
  )(ss.on.mock.calls);

  let msgs = []
  // 初始状态队列为空
  onGetQueueMsg((qm) => {
    msgs = qm
  })
  return msgs
}

test('获取断点队列', () => {
  // 初始状态队列为空
  expect(getQueueMsgs()).toEqual([])

  const url = 'http://erra.io/test'
  addBP(url, API_DATA_TYPE.REQUEST)
  hitBP(url, API_DATA_TYPE.REQUEST)

  expect(getQueueMsgs().length).toBe(1)
})

test('处理断点任务', () => {
  const onBPStart = pipe(
    fromPairs,
    prop(SOCKET_MSG_TAG_API.BP_MSG_START)
    // @ts-ignore
  )(ss.on.mock.calls);
  const onBPDone = pipe(
    fromPairs,
    prop(SOCKET_MSG_TAG_API.BP_MSG_DONE)
    // @ts-ignore
  )(ss.on.mock.calls);

  const url = 'http://erra.io/test'
  addBP(url, API_DATA_TYPE.REQUEST)
  const record = hitBP(url, API_DATA_TYPE.REQUEST)

  const [msg] = getQueueMsgs()
  expect(msg).toBeTruthy()

  onBPStart(msg.uuid, ({ httpDetail }) => {
    expect(httpDetail).toEqual(record.req)
  })

  onBPDone(msg.uuid, {})
  // 处理断点后 队列为空
  expect(getQueueMsgs().length).toBe(0)
})

test('跳过所有断点任务', () => {
  const url = 'http://erra.io/test'
  addBP(url, [API_DATA_TYPE.REQUEST, API_DATA_TYPE.RESPONSE])
  hitBP(url, API_DATA_TYPE.REQUEST)
  hitBP(url, API_DATA_TYPE.RESPONSE)
  
  expect(getQueueMsgs().length).toBe(2)
  passAllMsgs()
  expect(getQueueMsgs().length).toBe(0)
})
