import { Button, List, Icon } from "antd";
import React, { useState, useEffect } from "react";
import SnippetPanel from './snippet-panel';
import { SOCKET_MSG_TAG_API, Snippet } from "../lib/interface";
import sc from './socket-client'

const snippetObjTpl = {
  name: '',
  content: '',
}

export default function Snippets() {
  const [snippets, setSnippets] = useState([])
  const [activeSnippet, setActiveSnippet] = useState(null)

  useEffect(() => {
    sc.emit(SOCKET_MSG_TAG_API.SP_GET, (sps: Snippet[]) => {
      setSnippets(sps)
    })
    sc.on(SOCKET_MSG_TAG_API.SP_UPDATE, (sps: Snippet[]) => {
      setSnippets(sps)
    })
    return () => {
      sc.off(SOCKET_MSG_TAG_API.SP_UPDATE)
    }
  }, [])

  return <section>
    <Button onClick={() => setActiveSnippet({ ...snippetObjTpl })}>新增Snippet</Button>
    <List dataSource={snippets} renderItem={(it) => <div>
      <span>{it.name}</span>
      <span>{it.correlationApi}</span>
      <Icon onClick={() => {
        // todo: delete snippet
        // sc.emit(SOCKET_MSG_TAG_API.SP_DELETE, it.id)
      }} type="delete" />
    </div>}></List>
    {!!activeSnippet && <SnippetPanel
      snippet={activeSnippet}
      onSave={async (code) => {
        sc.emit(SOCKET_MSG_TAG_API.SP_SAVE, { id: activeSnippet.id, code })
      }}
    ></SnippetPanel>}
  </section>
}