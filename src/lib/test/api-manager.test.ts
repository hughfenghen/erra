import genUUID from 'uuid';

import { clearApiHistory, connectApiSnippet, getApiHistory, handleReq, handleResp } from '../api-manager';
import * as snippetManager from '../snippet-manager';

jest.mock('uuid');

jest.mock('../../server/socket-server')

let reqTpl
let respTpl

beforeEach(() => {
  genUUID.mockReturnValue('mock_uuid')
  reqTpl = {
    _erra_uuid: genUUID(),
    url: 'url',
    method: 'gET',
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
