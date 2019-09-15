import yaml from 'js-yaml';
import configManager from '../config-manager';
import { getSnippetFn, parseSnippetContent } from '../snippet-manager';

jest.mock('../../socket-server')

const bodyTpl = {
  store: {
    book: [
      {
        category: 'reference',
        author: 'Nigel Rees',
        title: 'Sayings of the Century',
        price: 8.95
      },
      {
        category: 'fiction',
        author: 'Evelyn Waugh',
        title: 'Sword of Honour',
        price: 12.99
      },
      {
        category: 'fiction',
        author: 'Herman Melville',
        title: 'Moby Dick',
        isbn: '0-553-21311-3',
        price: 8.99
      },
      {
        category: 'fiction',
        author: 'J. R. R. Tolkien',
        title: 'The Lord of the Rings',
        isbn: '0-395-19395-8',
        price: 22.99
      }
    ],
    bicycle: {
      color: 'red',
      price: 19.95
    }
  }
}

test('parseSnippetContent 返回一个函数', () => {
  expect(parseSnippetContent({})).toBeInstanceOf(Function);
})

test('fixed会覆盖原值', () => {
  const mergeFn = parseSnippetContent(yaml.load(`
    $fixed store: null
  `))

  expect(mergeFn(bodyTpl).store).toBe(null)
})

test('默认使用原值', () => {
  expect(parseSnippetContent({})(bodyTpl)).toEqual(JSON.parse(JSON.stringify(bodyTpl)))
})


test('未冲突的情况下，snippet与原值合并', () => {
  expect(parseSnippetContent({ a: 1, book: 2 })(bodyTpl)).toEqual(Object.assign({}, bodyTpl, { a: 1, book: 2 }))
})

test('使用mockjs生成string', () => {
  const mergeFn = parseSnippetContent(yaml.load(`
    store:
      $mockjs book: '@string'
  `))

  expect(typeof mergeFn(bodyTpl).store.book).toBe('string')
})

test('mockjs生成数组', () => {
  const mergeFn = parseSnippetContent(yaml.load(`
    store:
      $mockjs book|10:
        - item
  `))

  expect(mergeFn(bodyTpl).store.book).toBeInstanceOf(Array)
  expect(mergeFn(bodyTpl).store.book.length).toBe(10)
})

test('解析snippet引用', () => {
  const snippets = yaml.load(`
    snippetIdaaa:
      id: snippetIdaaa
      name: aaa
      content:
        $mockjs book|10:
          - item
        $snippet code: snippetIdCode200
    snippetIdCode200:
      id: snippetIdCode200
      name: aaa
      content: 200
  `)

  configManager.get = jest.fn(() => snippets)
  configManager.emit('afterConfigInit')

  const linkSnippet = getSnippetFn('snippetIdaaa')({ ttt: 111, code: 'abc' })
  expect(linkSnippet.ttt).toBe(111)
  expect(linkSnippet.book.length).toBe(10)
  expect(linkSnippet.code).toBe(200)
})

test('展开与源数据不匹配的snippet层级', () => {
  expect(parseSnippetContent({ foo: 'bar' })(null)).toEqual({ foo: 'bar' })
})
