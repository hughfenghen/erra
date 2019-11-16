import { SOCKET_MSG_TAG_API, Snippet } from "../../lib/interface";
import { useState, useEffect } from "react";
import sc from './socket-client'
import { isString } from "lodash/fp";
import { Expression, ExpSchema } from "../../lib/exp-yaml";
import yaml = require("js-yaml");

export function useSnippets(): Snippet[] {
  const [snippets, setSnippets] = useState<Snippet[]>([])

  useEffect(() => {
    sc.emit(SOCKET_MSG_TAG_API.SP_GET, (str) => {
      setSnippets(yaml.load(str, { schema: ExpSchema }))
    })

    const onUpadate = (str) => {
      setSnippets(yaml.load(str, { schema: ExpSchema }))
    }
    sc.on(SOCKET_MSG_TAG_API.SP_UPDATE, onUpadate)
    return () => {
      sc.off(SOCKET_MSG_TAG_API.SP_UPDATE, onUpadate)
    }
  }, [])

  return snippets
}