import genUUID from 'uuid';

import { SimpleReq, SimpleResp } from '../../../lib/interface';
import ss from '../../socket-server';
import { clearApiHistory, bindApiSnippet, getApiHistory, handleReq, handleResp } from '../api-manager';
import * as snippetManager from '../snippet-manager';

jest.mock('../../socket-server')
jest.mock('uuid');
genUUID.mockReturnValue('mock_uuid')


let reqTpl: SimpleReq
let respTpl: SimpleResp

beforeEach(() => {
  reqTpl = {
    __erra_uuid__: genUUID(),
    url: 'http://erra.io/test',
    method: 'GET',
    headers: {},
  }

  respTpl = {
    statusCode: 200,
    headers: {},
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
  expect(handleResp(respTpl, reqTpl).resp).toEqual(respTpl)
})

test('snippet修改statusCode', () => {
  const spyGetSnippet = jest.spyOn(snippetManager, 'getSnippetFn')
  spyGetSnippet.mockImplementation(() => (s) => Object.assign(s, { statusCode: 500 }))
  bindApiSnippet(reqTpl.url, 'mock_snippetid')

  // 给req打一个__erra_uuid__标记，在handleResp中可以匹配上
  handleReq(reqTpl)
  expect(handleResp(respTpl, reqTpl).resp.statusCode).toBe(500)
})

test('api记录更新时，广播消息通知client', () => {
  const broadcast = jest.spyOn(ss, 'broadcast')
  broadcast.mockClear()
  
  handleReq(reqTpl)
  expect(handleResp(respTpl, reqTpl).resp).toEqual(respTpl)
  
  clearApiHistory()

  expect(broadcast).toBeCalledTimes(3)
})
