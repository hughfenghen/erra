import { Button, List, Tag } from 'antd';
import { isEmpty } from 'lodash/fp';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { ApiRecord, SOCKET_MSG_TAG_API } from '../lib/interface';
import HttpContentPanel from './http-content-panel';
import sc from './socket-client';

export default function ApiRecords() {
  const [apiList, setApiList]: [ApiRecord[], (r: ApiRecord[]) => void] = useState([])
  const [httpDetail, setHttpDetail] = useState(null)

  useEffect(() => {
    sc.emit(SOCKET_MSG_TAG_API.GET_HISTORY, (records) => {
      setApiList(records)
    })
    return () => {
      sc.off(SOCKET_MSG_TAG_API.GET_HISTORY)
    }
  }, [])

  useEffect(() => {
    function onNewRecord(record: ApiRecord) {
      setApiList(apiList.concat(record))
    }
    sc.off(SOCKET_MSG_TAG_API.NEW_RECORD)
    sc.on(SOCKET_MSG_TAG_API.NEW_RECORD, onNewRecord)

    function onReplaceRecord(record: ApiRecord) {
      console.log(44555, record);
      setApiList(apiList.map((r) => r.uuid === record.uuid ? record : r))
    }
    sc.off(SOCKET_MSG_TAG_API.REPLACE_RECORD)
    sc.on(SOCKET_MSG_TAG_API.REPLACE_RECORD, onReplaceRecord)
    return () => {
      sc.off(SOCKET_MSG_TAG_API.NEW_RECORD)
      sc.off(SOCKET_MSG_TAG_API.REPLACE_RECORD)
    }
  }, [apiList])

  return <section>
    <List dataSource={apiList} renderItem={(it: ApiRecord) => <div>
      <Tag>{it.req.method}</Tag>
      <span>{it.req.url}</span>
      <span>
        <Button onClick={() => {
          setHttpDetail(it.req)
        }}>Request</Button>
        <Button onClick={() => {
          setHttpDetail(it.resp)
        }} disabled={isEmpty(it.resp)}>Response</Button>
      </span>
    </div>}></List>
    <HttpContentPanel content={httpDetail}></HttpContentPanel>
  </section>
}
