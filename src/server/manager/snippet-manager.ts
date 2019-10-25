import yaml from 'js-yaml';
import { constant, filter, fromPairs, identity, isArray, isFunction, isPlainObject, isRegExp, map, mapValues, mergeWith, pick, pipe, toPairs, values, __ } from 'lodash/fp';
import { mock } from 'mockjs';
import genUUID from 'uuid';
import { ApiRecord, API_DATA_TYPE, Snippet, SnippetContent, SOCKET_MSG_TAG_API } from '../../lib/interface';
import ss from '../socket-server';
import configManager from './config-manager';


const snippetsFn: { [key: string]: Function } = {}
const snippetsMeta: { [key: string]: Snippet} = {}
let enableSnippet = true

configManager.on('afterConfigInit', () => {
  Object.entries(configManager.get(configManager.key.SNIPPET) || {})
    .forEach(([key, val]: [string, Snippet]) => {
      snippetsMeta[key] = val
      snippetsFn[key] = parseSnippetContent(val.content)
    })
})

function getSnippetMetaList() {
  // 函数、正则转换成字符串，否则不能通过socket传递
  return JSON.stringify(
    values(snippetsMeta),
    (k, v) => {
      if (isFunction(v)) return `!!js/function ${v.toString()}`
      if (isRegExp(v)) return `!!js/regexp ${v.toString()}`
      return v
    }
  );
}

ss.on(SOCKET_MSG_TAG_API.SP_GET, (cb) => {
  cb(getSnippetMetaList())
})

ss.on(SOCKET_MSG_TAG_API.SP_SAVE, ({ id, code }, cb) => {
  const { name, content, when } = yaml.load(code)
  const spId = id || genUUID()
  snippetsMeta[spId] = Object.assign({}, snippetsMeta[spId], {
    id: spId,
    name,
    when,
    content,
  })

  configManager.emit('update', configManager.key.SNIPPET, snippetsMeta)
  snippetsFn[spId] = parseSnippetContent(content)
  ss.broadcast(SOCKET_MSG_TAG_API.SP_UPDATE, getSnippetMetaList())
})

ss.on(SOCKET_MSG_TAG_API.SP_DELETE, (id) => {
  // todo: 检查是否被引用
  delete snippetsFn[id]
  delete snippetsMeta[id]
  configManager.emit('update', configManager.key.SNIPPET, snippetsMeta)
  ss.broadcast(SOCKET_MSG_TAG_API.SP_UPDATE, getSnippetMetaList())
})

ss.on(SOCKET_MSG_TAG_API.SP_MAIN_ENABLED, (cb) => {
  cb(enableSnippet)
})

ss.on(SOCKET_MSG_TAG_API.SP_SET_MAIN_ENABLED, (val) => {
  enableSnippet = !!val
  ss.broadcast(SOCKET_MSG_TAG_API.SP_SET_MAIN_ENABLED, enableSnippet)
})

ss.on(SOCKET_MSG_TAG_API.SP_UPDAT_SINGLE_ENABLED, (id, enableStatus) => {
  snippetsMeta[id].enabled = enableStatus
  configManager.emit('update', configManager.key.SNIPPET, snippetsMeta)
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
      const parsed = snippetsFn[sId]
      if (parsed) return parsed

      const source = configManager.get(configManager.key.SNIPPET)[sId]
      if (!source) throw new Error(`[snippet解析错误]找不到依赖的snippet：${value}`)

      const ps = parseSnippetContent(source.content)
      snippetsFn[sId] = ps
      return ps
  }
  return identity
}

function parse(snippet: SnippetContent) {
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
  } else if (isFunction(snippet)) {
    return snippet
  }
  return parseStrategy({ value: snippet })
}

/**
 * 当源数据 与 snippet字段不匹配时，snippet中有些元素是一个Function
 * 递归将snippet中的所有函数执行，生成数据
 * @param remainder 
 */
function expandSnippet(remainder) {
  if (isFunction(remainder)) return remainder()
  if (isArray(remainder)) return map(expandSnippet)(remainder)
  if (isPlainObject(remainder)) return mapValues(expandSnippet)(remainder)
  return remainder
}

/**
 * 解析SnippetContent
 * @param snippet 生成数据的策略
 * @return Function
 */
export function parseSnippetContent(snippet: SnippetContent): (data: any) => any {
  const snippeter = parse(snippet)

  return (data): any => {
    if (isFunction(snippeter)) return snippeter(data)
    if (isPlainObject(data) && isPlainObject(snippeter)) {
      const rs = mergeWith((subOriginVal, subSnippetVal) => {
        if (isFunction(subSnippetVal)) {
          return subSnippetVal(subOriginVal)
        }
        return undefined
      }, data, snippeter)
      return rs
    }
    return expandSnippet(snippeter)
  }
}

/**
 * 获取解析后的snippet
 * @param id snippetId
 * @return Function 按配置策略处理传入的参数后返回
 */
export function getSnippetFn(id: string): Function {
  if (enableSnippet) return snippetsFn[id]
  // 关闭Snippet转换功能时，返回一个不对数据做任何处理的函数identity
  return identity
}

/**
 * 获取满足触发的条件Snippet
 * @param record ApiRecord
 */
export function matchedSnippetFns(record: ApiRecord): Function[] {
  if (!enableSnippet) return []
  const { req, resp, parsedUrl } = record
  
  // url前追加req|resp、method，让正则可以更精确地匹配
  // 结构为：DataType#Method#Url
  const recordMeta = `${resp ? API_DATA_TYPE.RESPONSE : API_DATA_TYPE.REQUEST}#${req.method}#${parsedUrl.href}`

  return pipe(
    values,
    filter(({ enabled, when }) => (
      enabled && when && 
      (isRegExp(when) ? when.test(recordMeta) : when(record)))
    ),
    map('id'),
    pick(__, snippetsFn),
    values
  )(snippetsMeta)
}