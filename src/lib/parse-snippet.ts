import { constant, fromPairs, identity, isArray, isFunction, isPlainObject, keys, map, mergeWith, omitBy, pipe, toPairs } from 'lodash/fp';

import { mock } from 'mockjs';

export type VALUE_PARSE_STRATEGY = 'fixed' | 'origin' | 'mockjs' | 'snippet'

function transDesc({ strategy = 'fixed', value, keyModifier = null }) {
  switch (strategy) {
    case 'fixed':
      return value == null ? identity : constant(value)
    case 'origin':
      return identity
    case 'mockjs':
      if (keyModifier) {
        return constant(
          mock({
            [`placeholder|${keyModifier}`]: value
          }).placeholder
        )
      }
      return constant(mock(value))
  }
  return identity
}

function parseSnippet(snippet) {
  if (isPlainObject(snippet)) {
    const reg = /__(.+)_desc__/
    return pipe(
      toPairs,
      map(([key, val]) => {
        if (!reg.test(key)) return [key, parseSnippet(val)]
        return [key.replace(reg, '$1'), transDesc(val)]
      }),
      fromPairs,
    )(snippet)
  } else if (isArray(snippet)) {
    return map(parseSnippet)(snippet)
  }
  return transDesc({ value: snippet })
}

export default function parse(snippet) {
  const snippeter = parseSnippet(snippet)

  return (data): any => {
    if (isFunction(snippeter)) return snippeter(data)
    const rs = mergeWith((objValue, srcValue) => {
      if (isFunction(srcValue)) {
        return srcValue(objValue)
      }
      return undefined
    }, data, snippeter)
    console.log('------------', JSON.stringify(rs));
    return rs
  }
}