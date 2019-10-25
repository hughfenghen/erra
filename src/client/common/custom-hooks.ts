import { SOCKET_MSG_TAG_API, Snippet } from "../../lib/interface";
import { useState, useEffect } from "react";
import sc from './socket-client'
import { isString } from "lodash/fp";

function parseSPJson (str) {
  return JSON.parse(
    str,
    (k, v) => {
      // 将字符串反序列化为函数
      if (isString(v)) {
        if (v.startsWith('!!js/function')) {
          // 生成唯一函数名, 临时挂载到window上，拿到引用后删除变量
          const fnName = '$' + Math.random().toString().slice(2)
          eval(v.replace(/^\!\!js\/function\s*/, `window.${fnName}=`))

          const rs = window[fnName]
          delete window[fnName]
          return rs
        } else if (v.startsWith('!!js/regexp')) {
          const regStr = v.replace(/^\!\!js\/regexp\s*/, '')
          return new RegExp(
            /^\/(.+)\//.exec(regStr)[1], // pattern
            regStr.replace(/^.*\//, '')  // flag
          )
        }
      }
      return v
    }
  )
}

export function useSnippets(): Snippet[] {
  const [snippets, setSnippets] = useState<Snippet[]>([])

  useEffect(() => {
    sc.emit(SOCKET_MSG_TAG_API.SP_GET, (str) => {
      setSnippets(parseSPJson(str))
    })

    const onUpadate = (str) => {
      setSnippets(parseSPJson(str))
    }
    sc.on(SOCKET_MSG_TAG_API.SP_UPDATE, onUpadate)
    return () => {
      sc.off(SOCKET_MSG_TAG_API.SP_UPDATE, onUpadate)
    }
  }, [])

  return snippets
}