import React, { useState, useEffect } from 'react';
import { List, Divider, Button, Checkbox } from 'antd';
import yaml from 'js-yaml';
import s from './style.less'
import { BPMsg, SOCKET_MSG_TAG_API } from '../lib/interface';
import sc from './common/socket-client';
import Editor from './common/editor';

export default function BreakpointQueue() {
  const [bpMsgs, setBPMsgs] = useState<BPMsg[]>([])
  const [activeMsg, setActiveMsg] = useState<BPMsg>(null)
  const [code, setCode] = useState('')

  useEffect(() => {
    sc.emit(SOCKET_MSG_TAG_API.BP_MSG_GET_QUEUE, (msgs) => {
      setBPMsgs(msgs)
    })
    
    sc.on(SOCKET_MSG_TAG_API.BP_MSG_NEW, (msg) => {
      setBPMsgs(list => list.concat(msg))
    })

    sc.on(SOCKET_MSG_TAG_API.BP_MSG_REMOVE, (rId) => {
      if (rId === 'all') {
        setBPMsgs([])
        return
      }
      setBPMsgs(list => list.filter(({ uuid }) => uuid !== rId))
    })

    return () => {
      sc.off(SOCKET_MSG_TAG_API.BP_MSG_NEW)
      sc.off(SOCKET_MSG_TAG_API.BP_MSG_REMOVE)
    }
  }, [])

  useEffect(() => {
    // id不可编辑
    setCode(activeMsg ? yaml.safeDump(activeMsg.httpDetail) : '')
  }, [activeMsg])

  const abortEl = (msg) => <Button onClick={() => {
    sc.emit(SOCKET_MSG_TAG_API.BP_MSG_ABORT, msg.uuid)
  }}>中断</Button>
  return <section className={s.bpPage}>
    <div className={s.opBar}></div>
    <List
      dataSource={bpMsgs}
      renderItem={(it) => <div className={s.listItem}>
        <span>{it.parsedUrl.shortHref}</span>
        <Divider type="vertical" />
        <div>
          <Button onClick={() =>{
            sc.emit(SOCKET_MSG_TAG_API.BP_MSG_START, it.uuid, (msg) => {
              setActiveMsg(msg)
            })
          }}>调试</Button>
          {abortEl(it)}
          <Button onClick={() => {
            sc.emit(SOCKET_MSG_TAG_API.BP_MSG_DONE, it.uuid)
          }}>跳过</Button>
        </div>
      </div>}
    ></List>
    {!!code && <Editor
      value={code}
    >
      <Button onClick={() => {
        sc.emit(SOCKET_MSG_TAG_API.BP_MSG_DONE, {
          id: activeMsg.uuid,           
          code,
        })
      }}>完成</Button>
      {abortEl(activeMsg)}
      <Button>跳过</Button>
      <Checkbox>完成后自动开始下一个</Checkbox>
    </Editor>}
  </section>
}