import { Button, Checkbox, Divider, Icon, List, Tag } from 'antd';
import { isEmpty } from 'lodash/fp';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { API_DATA_TYPE, ApiRecord, BreakPoint, SOCKET_MSG_TAG_API } from '../lib/interface';
import HttpContentPanel from './http-content-panel';
import sc from './socket-client';

export default function ApiRecords() {
  const [apiList, setApiList]: [ApiRecord[], (r: ApiRecord[]) => void] = useState([])
  const [httpDetail, setHttpDetail] = useState(null)
  const [breakpoints, setBreakpoints]: [BreakPoint[], (r: BreakPoint[]) => void] = useState([])
  const [debugHttp, setDebugHttp] = useState(false)

  const enableBP = useCallback((rUrl, rType) => {
    return breakpoints.some(({ type, url }) => rType === type && rUrl === url)
  }, [breakpoints])

  useEffect(() => {
    sc.emit(SOCKET_MSG_TAG_API.GET_HISTORY, (records) => {
      setApiList(records)
    })
    sc.emit(SOCKET_MSG_TAG_API.BP_GET, (bps) => {
      setBreakpoints(bps)
    })
    sc.on(SOCKET_MSG_TAG_API.BP_UPDATE, (bps) => {
      setBreakpoints(bps)
    })
    sc.on(SOCKET_MSG_TAG_API.BP_RESP_START, (resp) => {
      setDebugHttp(true)
      setHttpDetail(resp)
    })

    return () => {
      sc.off(SOCKET_MSG_TAG_API.BP_UPDATE)
      sc.off(SOCKET_MSG_TAG_API.BP_RESP_START)
    }
  }, [])

  useEffect(() => {
    function onNewRecord(record: ApiRecord) {
      setApiList(apiList.concat(record))
    }
    sc.off(SOCKET_MSG_TAG_API.NEW_RECORD)
    sc.on(SOCKET_MSG_TAG_API.NEW_RECORD, onNewRecord)

    function onReplaceRecord(record: ApiRecord) {
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
      <Divider type="vertical"></Divider>
      <span>{it.req.url}</span>
      <Divider type="vertical"></Divider>
      <span>
        <Icon type="bug" />
        <Checkbox.Group
          value={Object.values(API_DATA_TYPE)
            .filter((type) => enableBP(it.req.url, type))
          }
          onChange={(vals) => {
            sc.emit(SOCKET_MSG_TAG_API.BP_UPDATE_BY_URL, it.req.url, vals)
          }}
        >
          {Object.values(API_DATA_TYPE).map((val) =>
            <Checkbox value={val} key={val}>{val}</Checkbox>)}
        </Checkbox.Group>
      </span>
      <Divider type="vertical"></Divider>
      <span>
        <Button onClick={() => {
          setHttpDetail(it.req)
        }}>Request</Button>
        <Button onClick={() => {
          setHttpDetail(it.resp)
        }} disabled={isEmpty(it.resp)}>Response</Button>
      </span>
    </div>}></List>
    <HttpContentPanel
      content={httpDetail}
      debug={debugHttp}
      onDone={(httpContent) => {
        setDebugHttp(false)
        sc.emit(SOCKET_MSG_TAG_API.BP_RESP_DONE, httpContent)
      }}
    ></HttpContentPanel>
  </section>
}
