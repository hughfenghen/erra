import parse from './parse-snippet';

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
    body: 'success',
    __body_desc__: 'fixed',
  })

  expect(concatFn(bodyTpl)).toBe({
    body: 'success'
  })
})

test('parse to origin value (default)', () => {
  const concatFn = parse({
    __body_desc__: {
      strategy: 'origin',
    }
  })

  expect(concatFn(bodyTpl)).toBe({
    body: JSON.parse(JSON.stringify(bodyTpl))
  })
  // default origin
  expect(parse({})(bodyTpl)).toBe(JSON.parse(JSON.stringify(bodyTpl)))
})

test('generate value by mockjs', () => {
  const concatFn = parse({
    body: {
      store: {
        'book|2': [{
          category: 'reference',
          author: 'Nigel Rees',
          title: 'Sayings of the Century',
          price: 8.95
        }],
        '__book|2_desc__': {
          strategy: 'mockjs',
        },
      }
    }
  })

  expect(concatFn(bodyTpl).body.store.book.length).toBe(10)
})

test('link snippet', () => {
  const snippets = {
    'oqif-aiiw-kj1n-j32j-232d': {
      strategy: 'mockjs',
      value: ['@ARRAY', {
        category: 'reference',
        author: 'Nigel Rees',
        title: 'Sayings of the Century',
        price: 8.95
      }, 1, 4]
    }
  }
  const concatFn = parse({
    body: {
      store: {
        bicycle: [],
        '__bicycle_desc__': {
          strategy: 'snippet|oqif-aiiw-kj1n-j32j-232d',
        },
      }
    }
  })
  expect(concatFn(bodyTpl).store.bicycle).toBe({
    color: 'red',
    price: 19.95
  })
})
