import genUUID from 'uuid';

import * as ss from '../../server/socket-server';
import {
  clearApiHistory,
  connectApiSnippet,
  getApiHistory,
  handleReq,
  handleResp,
  SimpleReq,
  SimpleResp,
} from '../api-manager';
import * as snippetManager from '../snippet-manager';

jest.mock('uuid');
genUUID.mockReturnValue('mock_uuid')

jest.mock('../../server/socket-server')

let reqTpl: SimpleReq
let respTpl: SimpleResp

beforeEach(() => {
  reqTpl = {
    _erra_uuid: genUUID(),
    url: 'url',
    method: 'GET',
    headers: {},
  }

  respTpl = {
    statusCode: 200,
    headers: {},
    url: 'url',
  }
  clearApiHistory()
})

test('调用handleReq将创建一条请求记录', () => {
  handleReq(reqTpl)
  expect(getApiHistory().length).toBe(1)
})

test('没有匹配到snippet时, 返回原值', () => {
  // 避免console.error
  handleReq(reqTpl)
  expect(handleResp(respTpl, reqTpl)).toEqual(respTpl)
})

test('snippet修改statusCode', () => {
  connectApiSnippet('/.*/', 'snippetId')

  const spyGetSnippet = jest.spyOn(snippetManager, 'getSnippet')
  spyGetSnippet.mockImplementation(() => (s) => Object.assign(s, { statusCode: 500 }))

  handleReq(reqTpl)
  expect(handleResp(respTpl, reqTpl).statusCode).toBe(500)
})

test('api记录更新时，广播消息通知client', () => {
  const broadcast = jest.spyOn(ss, 'broadcast')
  broadcast.mockClear()
  
  handleReq(reqTpl)
  expect(handleResp(respTpl, reqTpl)).toEqual(respTpl)
  
  clearApiHistory()

  expect(broadcast).toBeCalledTimes(3)
})
