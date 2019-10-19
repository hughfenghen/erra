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
  const [autoNext, setAutoNext] = useState(true)
  const [bpEnabled, setBPEnabled] = useState(true)

  useEffect(() => {
    sc.emit(SOCKET_MSG_TAG_API.BP_MSG_GET_QUEUE, (msgs) => {
      setBPMsgs(msgs)
    })

    sc.emit(SOCKET_MSG_TAG_API.BP_MSG_ENABLED, (val) => {
      setBPEnabled(val)
    })

    sc.on(SOCKET_MSG_TAG_API.BP_MSG_NEW, (msg) => {
      setBPMsgs(list => list.concat(msg))
    })

    sc.on(SOCKET_MSG_TAG_API.BP_MSG_SET_ENABLED, (val) => {
      setBPEnabled(val)
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
      sc.off(SOCKET_MSG_TAG_API.BP_MSG_SET_ENABLED)
    }
  }, [])

  useEffect(() => {
    // id不可编辑
    setCode(activeMsg ? yaml.dump(activeMsg.httpDetail) : '')
  }, [activeMsg])

  function getNextMsg() {
    if (!autoNext) {
      setActiveMsg(null)
      return
    }
    // 下一条消息 即：id与当前不相等的第一条
    const nm = bpMsgs.find(({ uuid }) => activeMsg.uuid !== uuid)
    if (!nm) {
      setActiveMsg(null)
      return
    }
    sc.emit(SOCKET_MSG_TAG_API.BP_MSG_START, nm.uuid, (msg) => {
      setActiveMsg(msg)
    })
  }

  const abortEl = (msg, inEditor) => <Button onClick={() => {
    sc.emit(SOCKET_MSG_TAG_API.BP_MSG_ABORT, msg.uuid)

    if (inEditor && autoNext) getNextMsg()
    else if (activeMsg && msg.uuid === activeMsg.uuid) setActiveMsg(null)
  }}>中断</Button>
  const passEl = (msg, inEditor) => <Button onClick={() => {
    sc.emit(SOCKET_MSG_TAG_API.BP_MSG_DONE, { id: msg.uuid })

    if (inEditor && autoNext) getNextMsg()
    else if (activeMsg && msg.uuid === activeMsg.uuid) setActiveMsg(null)
  }}>跳过</Button>

  return <section className={s.bpMsgQueue}>
    <div className={s.opBar}>
      <Checkbox
        checked={bpEnabled}
        onChange={({ target: { checked } }) => {
          sc.emit(SOCKET_MSG_TAG_API.BP_MSG_SET_ENABLED, checked)
        }}
      >启用断点</Checkbox>
      {bpMsgs.length > 0 && <Button
        onClick={() => {
          sc.emit(SOCKET_MSG_TAG_API.BP_MSG_PASS_ALL)
          setActiveMsg(null)
        }}
      >跳过所有</Button>}
    </div>
    <List
      dataSource={bpMsgs}
      renderItem={(it) => <div
        className={s.listItem}
        style={{ backgroundColor: (activeMsg || {}).uuid === it.uuid ? '#eee' : '' }}
      >
        <div className={s.url}>
          <div>{it.parsedUrl.pathname}</div>
          <div>{it.parsedUrl.origin}</div>
        </div>
        <Divider type="vertical" />
        <div className={s.op}>
          <Button onClick={() => {
            sc.emit(SOCKET_MSG_TAG_API.BP_MSG_START, it.uuid, (msg) => {
              setActiveMsg(msg)
            })
          }}>调试</Button>
          {abortEl(it, false)}
          {passEl(it, false)}
        </div>
      </div>}
    ></List>
    {!!code && <Editor
      value={code}
      onChange={(val) => setCode(val)}
      onClose={() => { setActiveMsg(null) }}
    >
      <Button onClick={() => {
        sc.emit(SOCKET_MSG_TAG_API.BP_MSG_DONE, {
          id: activeMsg.uuid,
          code,
        })
        getNextMsg()
      }}>完成</Button>
      {abortEl(activeMsg, true)}
      {passEl(activeMsg, true)}
      <Checkbox checked={autoNext} onChange={({ target: { checked } }) => {
        setAutoNext(checked)
      }}>自动开始下一个</Checkbox>
    </Editor>}
  </section>
}