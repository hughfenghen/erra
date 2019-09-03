import { Button, List, Icon, Divider } from "antd";
import React, { useState, useEffect } from "react";
import SnippetPanel from './snippet-panel';
import { SOCKET_MSG_TAG_API, Snippet } from "../../lib/interface";
import sc from '../common/socket-client'
import { useSnippets } from "../common/custom-hooks";

const snippetObjTpl = {
  name: '',
  content: '',
}

export default function Snippets() {
  const snippets = useSnippets()
  const [activeSnippet, setActiveSnippet] = useState(null)

  return <section>
    <Button onClick={() => setActiveSnippet({ ...snippetObjTpl })}>新增Snippet</Button>
    <List dataSource={snippets} renderItem={(it) => <div>
      <span>{it.name}</span>
      <Divider type="vertical"></Divider>
      <span>{it.id}</span>
      <Divider type="vertical"></Divider>
      <span>{it.correlationApi}</span>
      <Divider type="vertical"></Divider>
      <Icon onClick={() => {
        sc.emit(SOCKET_MSG_TAG_API.SP_DELETE, it.id)
      }} type="delete" />
    </div>}></List>
    {!!activeSnippet && <SnippetPanel
      snippet={activeSnippet}
      onSave={async (code) => {
        sc.emit(SOCKET_MSG_TAG_API.SP_SAVE, { id: activeSnippet.id, code })
        setActiveSnippet(null)
      }}
    ></SnippetPanel>}
  </section>
}