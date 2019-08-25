import { pick, constant, fromPairs, identity, isArray, isFunction, isPlainObject, map, mergeWith, pipe, toPairs } from 'lodash/fp';
import { mock } from 'mockjs';
import yaml from 'js-yaml'
import genUUID from 'uuid';

import configManager from './config-manager';
import ss from '../socket-server'
import { SOCKET_MSG_TAG_API, Snippet } from '../../lib/interface';

const snippetsFn = new Map<string, Function>()
const snippetsMeta = new Map<string, Snippet>()

configManager.on('afterConfigInit', () => {
  Object.entries(configManager.get('snippets') || {})
    .forEach(([key, val]) => {
      snippetsFn.set(key, parse(val))
    })
})

function getSnippetList () {
  return map(pick(['id', 'name', 'correlationApi']), [...snippetsMeta.values()])
}

ss.on(SOCKET_MSG_TAG_API.SP_GET, (cb) => {
  cb(getSnippetList())
})

ss.on(SOCKET_MSG_TAG_API.SP_SAVE, ({ id, code }, cb) => {
  const sp = yaml.load(code)
  const spId = id || genUUID()
  snippetsMeta.set(spId, {
    id,
    ...sp
  })
  snippetsFn.set(spId, parse(sp.content))
  ss.broadcast(SOCKET_MSG_TAG_API.SP_UPDATE, getSnippetList())
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
      const parsed = snippetsFn.get(snippetId)
      if (parsed) return parsed
      
      const source = configManager.get('snippets')[snippetId]
      if (!source) throw new Error(`[snippet解析错误]找不到依赖的snippet：${snippetId}`)

      const ps = parseSnippet(source)
      snippetsFn.set(snippetId, ps)
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

export function parse(snippet): (data: any) => any {
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
  return snippetsFn.get(id)
}

export function addSnippet (id: string, snippet: any): void {
  snippetsFn.set(id, parse(snippet))
}
