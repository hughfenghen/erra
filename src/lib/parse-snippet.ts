import { constant, fromPairs, identity, isArray, isFunction, isPlainObject, map, mergeWith, pipe, toPairs } from 'lodash/fp';
import { mock } from 'mockjs';

import config from './config-manager';

const snippets = new Map<string, Function>()

config.on('afterConfitInit', () => {
  Object.entries(config.get('snippet') || {})
    .forEach(([key, val]) => {
      snippets.set(key, parse(val))
    })
})

export enum VALUE_PARSE_STRATEGY {
  fixed,
  origin,
  mockjs,
  snippet,
}

// 将策略解析成函数
function transDesc({ strategy = 'fixed', value, keyModifier = null, snippetId = null }): Function {
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
    case 'snippet':
      // snippet 是否被解析过，如果没有则解析后更新snippets
      const parsed = snippets.get(snippetId)
      if (parsed) return parsed
      
      const source = config.get('snippet')[snippetId]
      if (!source) throw new Error(`[snippet解析错误]找不到依赖的snippet：${snippetId}`)

      const ps = parseSnippet(source)
      snippets.set(snippetId, ps)
      return ps
  }
  return identity
}

// 判断对象是否是策略描述类型
function isStrategyDesc (obj) {
  return !!obj && obj.strategy in VALUE_PARSE_STRATEGY
}

function parseSnippet(snippet) {
  if (isPlainObject(snippet)) {
    if (isStrategyDesc(snippet)) {
      return transDesc(snippet)
    }

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

export default function parse(snippet): (data: any) => any {
  const snippeter = parseSnippet(snippet)

  return (data): any => {
    if (isFunction(snippeter)) return snippeter(data)
    const rs = mergeWith((objValue, srcValue) => {
      if (isFunction(srcValue)) {
        return srcValue(objValue)
      }
      return undefined
    }, data, snippeter)
    return rs
  }
}

export function getSnippet (id: string): Function {
  return snippets.get(id)
}

export function addSnippet (id: string, snippet: any): void {
  snippets.set(id, parse(snippet))
}
