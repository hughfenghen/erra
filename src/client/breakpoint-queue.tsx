import React, { useState, useEffect } from 'react';
import { List, Divider, Button, Checkbox } from 'antd';
import s from './style.less'
import { BPMsg, SOCKET_MSG_TAG_API } from '../lib/interface';
import sc from './common/socket-client';
import Editor from './common/editor';

export default function BreakpointQueue() {
  const [bpMsgs, setBPMsgs] = useState<BPMsg[]>([])

  useEffect(() => {
    sc.emit(SOCKET_MSG_TAG_API.BP_GET_QUEUE_MSGS)
  }, [])

  return <section className={s.bpPage}>
    <div className={s.opBar}></div>
    <List
      dataSource={bpMsgs}
      renderItem={(it) => <div className={s.listItem}>
        <span>{it.parsedUrl.shortHref}</span>
        <Divider type="vertical" />
        <div>
          <Button>调试</Button>
          <Button>中断</Button>
          <Button>跳过</Button>
        </div>
      </div>}
    ></List>
    <Editor>
      <Button>中断</Button>
      <Button>跳过</Button>
      <Checkbox>完成后自动开始下一个</Checkbox>
    </Editor>
  </section>
}