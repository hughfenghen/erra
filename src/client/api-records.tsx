import { List, Tag } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { ApiRecord, SOCKET_MSG_TAG_API } from '../lib/interface';
import sc from './socket-client';

export default function ApiRecords() {
  const [apiList, setApiList]: [ApiRecord[], (records: ApiRecord[]) => void] = useState([])

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
    <List dataSource={apiList} renderItem={(it: ApiRecord) => <>
      <Tag>{it.req.method}</Tag>
      <span>{it.req.url}</span>
    </>}></List>
  </section>
}

function usePrevious(value) {
  // The ref object is a generic container whose current property is mutable ...
  // ... and can hold any value, similar to an instance property on a class
  const ref = useRef();

  // Store current value in ref
  useEffect(() => {
    ref.current = value;
  }, [value]); // Only re-run if value changes

  // Return previous value (happens before update in useEffect above)
  return ref.current;
}
