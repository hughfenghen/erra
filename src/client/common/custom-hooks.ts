import { SOCKET_MSG_TAG_API, Snippet } from "../../lib/interface";
import { useState, useEffect } from "react";
import sc from './socket-client'
import { isString } from "lodash/fp";
import genUUID from 'uuid';

function parseSPJson (str) {
  return JSON.parse(
    str,
    (k, v) => {
      // 将字符串反序列化为函数
      if (isString(v) && v.startsWith('!!js/function')) {
        // 配合uuid生成唯一函数名（函数名不能含-，不能以数字开头）
        const fnName = '$' + genUUID().replace(/-/g, '')
        eval(v.replace(/^\!\!js\/function\s*/, `window.${fnName}=`))
        
        const rs = window[fnName]
        delete window[fnName]
        return rs
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