import { List, Tag } from 'antd';
import React, { useEffect, useState } from 'react';

import { ApiRecord, SOCKET_MSG_TAG_API } from '../lib/interface';
import sc from './socket-client';

export default function ApiRecords() {
  const [apiList, setApiList] = useState([])
  useEffect(() => {
    sc.emit(SOCKET_MSG_TAG_API.GET_HISTORY, (records) => {
      setApiList(records)
    })

    sc.on(SOCKET_MSG_TAG_API.NEW_RECORD, (record) => {
      console.log(444333, apiList);
      setApiList(apiList.concat(record))
    })
  }, [])

  return <section>
    <List dataSource={apiList} renderItem={(it: ApiRecord) => <>
      <Tag>{it.req.method}</Tag>
      <span>{it.req.url}</span>
    </>}></List>
  </section>
}