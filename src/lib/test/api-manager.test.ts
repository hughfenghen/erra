jest.mock('../../server/socket-server')

import { handleResp, connectApiSnippet} from '../api-manager';
import * as snippetManager from '../snippet-manager';

let respTpl

beforeEach(() => {
  respTpl = {
    uuid: 'xxx',
    statusCode: 200,
    headers: {},
    url: 'url',
  }
})

describe('handleResp', () => {
  test('no match snippet, return origin value', () => {
    expect(handleResp(respTpl)).toEqual(respTpl)
  })

  test('snippet modify `statusCode`', () => {
    connectApiSnippet('/.*/', 'snippetId')
    
    const spyGetSnippet = jest.spyOn(snippetManager, 'getSnippet')
    spyGetSnippet.mockImplementation(() => (s) => Object.assign(s, { statusCode: 500 }))

    expect(handleResp(respTpl).statusCode).toBe(500)
  })
})
