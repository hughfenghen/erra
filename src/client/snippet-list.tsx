import { Button, Divider, Icon, List } from 'antd';
import yaml from 'js-yaml';
import React, { useEffect, useState } from 'react';

import { SOCKET_MSG_TAG_API } from '../lib/interface';
import { useSnippets } from './common/custom-hooks';
import Editor from './common/editor';
import sc from './common/socket-client';
import s from './style.less';
import { omit } from 'lodash/fp';

const snippetObjTpl = {
  name: '',
  content: '',
}

export default function Snippets() {
  const snippets = useSnippets()
  const [activeSnippet, setActiveSnippet] = useState(null)
  const [code, setCode] = useState('')

  useEffect(() => {
    // id不可编辑
    setCode(activeSnippet ? yaml.safeDump(omit('id', activeSnippet)) : '')
  }, [activeSnippet])

  return <section className={s.snippetList}>
    <Button onClick={() => setActiveSnippet({ ...snippetObjTpl })}>新增Snippet</Button>
    <List dataSource={snippets} renderItem={(it) => <div
      onClick={() => {
        setActiveSnippet(it)
      }}
      className={s.listItem}
    >
      <span>{it.name}</span>
      <Divider type="vertical"></Divider>
      <span>{it.id}</span>
      <Divider type="vertical"></Divider>
      <span>{it.correlationApi || '-'}</span>
      <Divider type="vertical"></Divider>
      <Icon onClick={(evt) => {
        evt.stopPropagation()
        setActiveSnippet(null)
        sc.emit(SOCKET_MSG_TAG_API.SP_DELETE, it.id)
      }} type="delete" />
    </div>}></List>
    {!!activeSnippet && <Editor
      value={code}
      onChange={(val) => { setCode(val) }}
      language="yaml"
      onClose={() => {
        setActiveSnippet(null)
      }}
    >
      <Button onClick={() => {
        sc.emit(SOCKET_MSG_TAG_API.SP_SAVE, { id: activeSnippet.id, code })
        setActiveSnippet(null)
      }}>保存</Button>
      <Button onClick={() => { setActiveSnippet(null) }}>取消</Button>
    </Editor>}
  </section>
}