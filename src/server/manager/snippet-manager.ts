import { pick, constant, fromPairs, identity, isArray, isFunction, isPlainObject, map, mergeWith, pipe, toPairs, values, mapValues } from 'lodash/fp';
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
      snippetsFn.set(key, parseSnippet(val))
    })
})

function getSnippetMetaList() {
  return map(pick(['id', 'name', 'correlationApi']), [...snippetsMeta.values()])
}

ss.on(SOCKET_MSG_TAG_API.SP_GET, (cb) => {
  cb(getSnippetMetaList())
})

ss.on(SOCKET_MSG_TAG_API.SP_SAVE, ({ id, code }, cb) => {
  const { name, content } = yaml.load(code)
  const spId = id || genUUID()
  snippetsMeta.set(spId, {
    id: spId,
    name,
    content,
  })
  snippetsFn.set(spId, parseSnippet(content))
  ss.broadcast(SOCKET_MSG_TAG_API.SP_UPDATE, getSnippetMetaList())
})

ss.on(SOCKET_MSG_TAG_API.SP_DELETE, (id) => {
  // todo: 检查是否被引用
  snippetsFn.delete(id)
  snippetsMeta.delete(id)
  ss.broadcast(SOCKET_MSG_TAG_API.SP_UPDATE, getSnippetMetaList())
})

export enum PARSE_STRATEGY {
  FIXED = 'fixed',
  MOCKJS = 'mockjs',
  SNIPPET = 'snippet',
}

// 将策略解析成函数
function parseStrategy({ strategy = 'fixed', value, key = null }): Function {
  switch (strategy) {
    case PARSE_STRATEGY.FIXED:
      return constant(value)
    case PARSE_STRATEGY.MOCKJS:
      if (key) {
        return constant(
          // transDesc是一个`返回value的函数`，所以此处只取mock的值
          // key 与 该函数 在上层关联
          values(mock({ [key]: value }))[0]
        )
      }
      return constant(mock(value))
    case PARSE_STRATEGY.SNIPPET:
      // 支持 ${name}|${snippetId} 这样的接口，方便阅读
      const sId = value.split('|').slice(-1)[0]

      // snippet 是否被解析过，如果没有则解析后更新snippets
      const parsed = snippetsFn.get(sId)
      if (parsed) return parsed

      const source = configManager.get('snippets')[sId]
      if (!source) throw new Error(`[snippet解析错误]找不到依赖的snippet：${value}`)

      const ps = parse(source)
      snippetsFn.set(sId, ps)
      return ps
  }
  return identity
}

function parse(snippet) {
  if (isPlainObject(snippet)) {
    const fixedRegx = new RegExp(`^\\$${PARSE_STRATEGY.FIXED}\\s+`)
    const mockjsRegx = new RegExp(`^\\$${PARSE_STRATEGY.MOCKJS}\\s+`)
    const snippetRegx = new RegExp(`^\\$${PARSE_STRATEGY.SNIPPET}\\s+`)

    return pipe(
      toPairs,
      map(([key, value]) => {
        if (fixedRegx.test(key)) {
          return [key.replace(fixedRegx, ''), parseStrategy({
            strategy: PARSE_STRATEGY.FIXED,
            value,
          })]
        } else if (mockjsRegx.test(key)) {
          return [
            // 去除掉mockjs key中包含的修饰符
            key.replace(mockjsRegx, '').replace(/\|.+$/, ''),
            parseStrategy({
              strategy: PARSE_STRATEGY.MOCKJS,
              key: key.replace(mockjsRegx, ''),
              value,
            })]
        } else if (snippetRegx.test(key)) {
          return [key.replace(snippetRegx, ''), parseStrategy({
            strategy: PARSE_STRATEGY.SNIPPET,
            value,
          })]
        }

        return [key, parse(value)]
      }),
      fromPairs,
    )(snippet)
  } else if (isArray(snippet)) {
    return map(parse)(snippet)
  }
  return parseStrategy({ value: snippet })
}

// 当源数据 与 snippet层级匹配时，snippet中有些元素是一个Function
// 递归将snippet中的所有函数执行，生成数据
function expandSnippet(snippet) {
  if (isFunction(snippet)) return snippet()
  if (isArray(snippet)) return map(expandSnippet)(snippet)
  if (isPlainObject(snippet)) return mapValues(expandSnippet)(snippet)
  return snippet
}

export function parseSnippet(snippet): (data: any) => any {
  const snippeter = parse(snippet)

  return (data): any => {
    if (isFunction(snippeter)) return snippeter(data)
    if (isPlainObject(data) && isPlainObject(snippeter)) {
      const rs = mergeWith((objValue, srcValue) => {
        if (isFunction(srcValue)) {
          return srcValue(objValue)
        }
        return undefined
      }, data, snippeter)
      return rs
    }
    return expandSnippet(snippeter)
  }
}

export function getSnippet(id: string): Function {
  return snippetsFn.get(id)
}

export function addSnippet(id: string, snippet: any): void {
  snippetsFn.set(id, parseSnippet(snippet))
}
