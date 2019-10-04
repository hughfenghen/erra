import { Button, Divider, Icon, List, Checkbox } from 'antd';
import yaml from 'js-yaml';
import React, { useEffect, useState } from 'react';

import { SOCKET_MSG_TAG_API } from '../lib/interface';
import { useSnippets } from './common/custom-hooks';
import Editor from './common/editor';
import sc from './common/socket-client';
import s from './style.less';
import { omit } from 'lodash/fp';

const snippetObjTpl = {
  __all_comment__: '只有name、content两个字段有效，不必输入或编辑其他内容',
  __name_comment__: 'name字段为必填项',
  name: '',
  __content_comment__: `1.必填项；
2.content下的内容将被解析为Snippet，与原值"合并"生成数据；
3.如果作为顶级Snippet（直接与请求绑定），content下只有"statusCode、headers、body"三个字段会对Response产生作用`,
  content: {},
}

export default function Snippets() {
  const snippets = useSnippets()
  const [activeSnippet, setActiveSnippet] = useState(null)
  const [code, setCode] = useState('')
  const [snippetEnabled, setSnippetEnabled] = useState(true)

  useEffect(() => {
    sc.emit(SOCKET_MSG_TAG_API.SP_ENABLED, (val) => {
      setSnippetEnabled(val)
    })
    sc.on(SOCKET_MSG_TAG_API.SP_SET_ENABLED, (val) => {
      setSnippetEnabled(val)
    })
    return () => {
      sc.off(SOCKET_MSG_TAG_API.SP_SET_ENABLED)
    }
  }, [])
  
  useEffect(() => {
    // id不可编辑
    setCode(activeSnippet ? yaml.safeDump(omit('id', activeSnippet)) : '')
  }, [activeSnippet])

  return <section className={s.snippetList}>
    <div className={s.opBar}>
      <Button onClick={() => setActiveSnippet({ ...snippetObjTpl })}>新增Snippet</Button>
      <Divider type="vertical"></Divider>
      <Checkbox checked={snippetEnabled} onChange={({ target: { checked } }) => {
        sc.emit(SOCKET_MSG_TAG_API.SP_SET_ENABLED, checked)
      }}>启用Snippet</Checkbox>
    </div>
    <List dataSource={snippets} renderItem={(it) => <div
      onClick={() => {
        setActiveSnippet(it)
      }}
      className={s.listItem}
      style={{ backgroundColor: it === activeSnippet ? '#eee' : '' }}
    >
      <strong>{it.name}</strong>
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