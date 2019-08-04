import config from '../config-manager';
import { getSnippet, parse } from '../snippet-manager';

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

test('`parse` return a fn', () => {
  expect(parse({})).toBeInstanceOf(Function);
})

test('parse to fixed value', () => {
  const concatFn = parse({
    __bicycle_desc__: {
      strategy: 'fixed',
      value: 'success'
    },
  })

  expect(concatFn(bodyTpl).bicycle).toBe('success')
})

test('parse to origin value (default)', () => {
  expect(parse({})(bodyTpl)).toEqual(JSON.parse(JSON.stringify(bodyTpl)))
})


test('merge snippet and origin value', () => {
  expect(parse({ a: 1, book: 2 })(bodyTpl)).toEqual(Object.assign({}, bodyTpl, { a: 1, book: 2 }))
})

test('generate `string` value by mockjs', () => {
  const concatFn = parse({
    store: {
      '__book_desc__': {
        strategy: 'mockjs',
        value: '@string',
      },
    }
  })

  expect(typeof concatFn(bodyTpl).store.book).toBe('string')
})

test('generate `Array` value by mockjs', () => {
  const concatFn = parse({
    store: {
      '__book_desc__': {
        strategy: 'mockjs',
        value: [{ a: 1 }],
        keyModifier: '10',
      },
    }
  })

  expect(concatFn(bodyTpl).store.book).toBeInstanceOf(Array)
  expect(concatFn(bodyTpl).store.book.length).toBe(10)
})

test('link snippet', () => {
  const snippets = {
    snippetIdaaa: {
      '__book_desc__': {
        strategy: 'mockjs',
        value: [{ a: 1 }],
        keyModifier: '10',
      },
      '__code_desc__': {
        strategy: 'snippet',
        snippetId: 'snippetIdCode200',
      },
      hasCode: {
        strategy: 'snippet',
        snippetId: 'snippetIdHasCode',
      },
    },
    snippetIdHasCode: {
      code: 500,
    },
    snippetIdCode200: {
      strategy: 'fixed',
      value: 200,
    }
  }
  const spyGet = jest.spyOn(config, 'get')
  spyGet.mockImplementation(() => snippets)
  config.emit('afterConfigInit')

  const linkSnippet = getSnippet('snippetIdaaa')({ ttt: 111 })
  expect(linkSnippet.ttt).toBe(111)
  expect(linkSnippet.book.length).toBe(10)
  expect(linkSnippet.code).toBe(200)
  expect(linkSnippet.hasCode).toEqual({ code: 500 })
})
