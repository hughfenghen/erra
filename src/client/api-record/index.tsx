import { Button, Checkbox, Divider, Icon, List, Tag, Select } from 'antd';
import { isEmpty } from 'lodash/fp';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { API_DATA_TYPE, ApiRecord, BreakPoint, SOCKET_MSG_TAG_API, Snippet, SimpleReq, SimpleResp } from '../../lib/interface';
import HttpContentPanel from './http-content-panel';
import sc from '../common/socket-client';
import { useSnippets } from '../common/custom-hooks';

export default function ApiRecords() {
  const [apiList, setApiList] = useState<ApiRecord[]>([])
  const [breakpoints, setBreakpoints] = useState<BreakPoint[]>([])
  const snippets = useSnippets()
  
  const [httpDetail, setHttpDetail] = useState<SimpleReq | SimpleResp>(null)
  const [debugHttp, setDebugHttp] = useState(false)
  const [apiSnippetPair, setApiSnippetPair] = useState({})

  const enableBP = useCallback((rUrl, rType) => {
    return breakpoints.some(({ type, url }) => rType === type && rUrl === url)
  }, [breakpoints])

  useEffect(() => {
    // 获取请求列表
    sc.emit(SOCKET_MSG_TAG_API.API_GET_HISTORY, (records: ApiRecord[]) => {
      setApiList(records)
    })
    // 获取断点数据
    sc.emit(SOCKET_MSG_TAG_API.BP_GET, (bps: BreakPoint[]) => {
      setBreakpoints(bps)
    })
    // 获取请求与snippet关联配置
    sc.emit(SOCKET_MSG_TAG_API.API_GET_SNIPPET_RELATION, (asp) => {
      setApiSnippetPair(asp)
    })
    // 监听请求与snippet关联配置
    sc.on(SOCKET_MSG_TAG_API.API_UPDATE_SNIPPET_RELATION, (asp) => {
      setApiSnippetPair(asp)
    })
    // 监听断点更新
    sc.on(SOCKET_MSG_TAG_API.BP_UPDATE, (bps: BreakPoint[]) => {
      setBreakpoints(bps)
    })
    // 断点开始，弹出code编辑框，可查看编辑requst、response
    sc.on(SOCKET_MSG_TAG_API.BP_START, (resp) => {
      setDebugHttp(true)
      setHttpDetail(resp)
    })
    // 更新、重置请求列表
    sc.on(SOCKET_MSG_TAG_API.API_UPDATE_RECORD, (records) => {
      setApiList(records)
    })

    return () => {
      sc.off(SOCKET_MSG_TAG_API.BP_UPDATE)
      sc.off(SOCKET_MSG_TAG_API.BP_START)
    }
  }, [])

  useEffect(() => {
    function onNewRecord(record: ApiRecord) {
      setApiList(apiList.concat(record))
    }
    sc.off(SOCKET_MSG_TAG_API.API_NEW_RECORD)
    sc.on(SOCKET_MSG_TAG_API.API_NEW_RECORD, onNewRecord)

    function onReplaceRecord(record: ApiRecord) {
      setApiList(apiList.map((r) => r.uuid === record.uuid ? record : r))
    }
    sc.off(SOCKET_MSG_TAG_API.API_REPLACE_RECORD)
    sc.on(SOCKET_MSG_TAG_API.API_REPLACE_RECORD, onReplaceRecord)
    return () => {
      sc.off(SOCKET_MSG_TAG_API.API_NEW_RECORD)
      sc.off(SOCKET_MSG_TAG_API.API_REPLACE_RECORD)
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
      <Select 
        value={apiSnippetPair[it.req.url]}
        onChange={(spId) => {
          sc.emit(SOCKET_MSG_TAG_API.API_BIND_SNIPPET, it.req.url, spId)
        }}
        style={{ width: '200px' }}
        allowClear
      >
        {snippets.map((it) => <Select.Option 
          value={it.id}
          key={it.id}
        >{it.name}</Select.Option>)}
      </Select>
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
        sc.emit(SOCKET_MSG_TAG_API.BP_DONE, httpContent)
      }}
    ></HttpContentPanel>
  </section>
}
