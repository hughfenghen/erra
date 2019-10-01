import { Button, Checkbox, Divider, Icon, List, Popover, Select, Tag } from 'antd';
import yaml from 'js-yaml';
import { isEmpty, includes, props, pipe, omit } from 'lodash/fp';
import React, { useCallback, useEffect, useState } from 'react';

import { API_DATA_TYPE, ApiRecord, SimpleReq, SimpleResp, SOCKET_MSG_TAG_API, BPMsg } from '../lib/interface';
import { useSnippets } from './common/custom-hooks';
import Editor from './common/editor';
import sc from './common/socket-client';
import s from './style.less';
import { safeJSONParse } from '../lib/utils';

export default function ApiRecords() {
  const [apiList, setApiList] = useState<ApiRecord[]>([])
  const [breakpoints, setBreakpoints] = useState({})
  const snippets = useSnippets()

  const [httpDetail, setHttpDetail] = useState<SimpleReq | SimpleResp>(null)
  const [apiSnippetPair, setApiSnippetPair] = useState({})
  const [code, setCode] = useState('')

  // 页面数据交互
  useEffect(() => {
    // 获取请求列表
    sc.emit(SOCKET_MSG_TAG_API.API_GET_HISTORY, (records: ApiRecord[]) => {
      setApiList(records)
    })
    // 获取断点数据
    sc.emit(SOCKET_MSG_TAG_API.BP_GET, (bps) => {
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
    sc.on(SOCKET_MSG_TAG_API.BP_UPDATE, (bps) => {
      setBreakpoints(bps)
    })
    // 更新、重置请求列表，清空列表记录
    sc.on(SOCKET_MSG_TAG_API.API_UPDATE_RECORD, (records) => {
      setApiList(records)
    })
    // 新的代理纪录
    sc.on(SOCKET_MSG_TAG_API.API_NEW_RECORD, (record: ApiRecord) => {
      setApiList(list => list.concat(record))
    })
    // 替换已有记录的内容（通常是resp更新）
    sc.on(SOCKET_MSG_TAG_API.API_REPLACE_RECORD, (record: ApiRecord) => {
      setApiList(
        list => list.map((r) => r.uuid === record.uuid ? record : r)
      )
    })

    return () => {
      sc.off(SOCKET_MSG_TAG_API.API_NEW_RECORD)
      sc.off(SOCKET_MSG_TAG_API.API_REPLACE_RECORD)
      sc.off(SOCKET_MSG_TAG_API.API_UPDATE_RECORD)
      sc.off(SOCKET_MSG_TAG_API.BP_UPDATE)
      sc.off(SOCKET_MSG_TAG_API.API_UPDATE_SNIPPET_RELATION)
    }
  }, [])

  // 为节省性能，初始化时获取的列表不包含详情
  // 查看详情时实时获取
  const onViewDetail = useCallback((it, type) => {
    if (it[type].body && it[type].headers) {
      setHttpDetail(it[type])
      return
    }
    sc.emit(SOCKET_MSG_TAG_API.API_GET_RECORD_DETAIL, it.uuid, (r) => {
      if (!r) throw new Error('找不到请求内容')
      setHttpDetail(r[type])
      Object.assign(it, r)
      setApiList(apiList)
    })
  }, [apiList])

  // 将当前激活对象映射成code 展示到editor中
  useEffect(() => {
    if (isEmpty(httpDetail)) {
      setCode('')
      return
    }

    setCode(yaml.safeDump({
      // 隐藏__erra_uuid__字段
      ...omit('__erra_uuid__', httpDetail),
      // 解析成json对象，yaml语法阅读优化
      ...(httpDetail.body ? { body: safeJSONParse(httpDetail.body) } : {}),
    }))
  }, [httpDetail])

  const debugColor = useCallback((bpTypes = []) => {
    if (bpTypes.length === 2) return '#b37feb'
    if (bpTypes.includes(API_DATA_TYPE.REQUEST)) return '#85a5ff'
    if (bpTypes.includes(API_DATA_TYPE.RESPONSE)) return '#ff85c0'
  }, [])

  return <section className={s.apiRecord}>
    <List dataSource={apiList} renderItem={(it: ApiRecord) => <div
      className={s.listItem}
      // 高亮选中项背景色
      style={{
        backgroundColor: pipe(
          props(['req', 'resp']),
          includes(httpDetail)
        )(it) ? '#eee' : undefined
      }}
    >
      <Popover title="断点时机" placement="right" content={
        <Checkbox.Group
          value={breakpoints[it.parsedUrl.shortHref]}
          onChange={(vals) => {
            sc.emit(
              SOCKET_MSG_TAG_API.BP_UPDATE_BY_URL,
              it.parsedUrl.shortHref,
              vals
            )
          }}
        >
          {Object.values(API_DATA_TYPE).map((val) =>
            <Checkbox value={val} key={val}>{val}</Checkbox>)}
        </Checkbox.Group>
      }>
        <div className={s.debugWrap}>
          <Icon
            style={{
              color: debugColor(breakpoints[it.parsedUrl.shortHref]),
            }}
            type="bug"
          />
        </div>
      </Popover>
      <Divider type="vertical"></Divider>
      <span>
        <Button size="small" onClick={() => {
          onViewDetail(it, 'req')
        }}>show req</Button>
        <br />
        <Button size="small" onClick={() => {
          onViewDetail(it, 'resp')
        }} disabled={isEmpty(it.resp)}>show resp</Button>
      </span>
      <Divider type="vertical"></Divider>
      <div style={{ color: it.resp.statusCode >= 400 ? 'red' : '' }}>
        <div>{it.parsedUrl.pathname}</div>
        <div>{it.parsedUrl.origin}</div>
      </div>
      <Divider type="vertical"></Divider>
      <Select
        value={apiSnippetPair[it.parsedUrl.shortHref] || []}
        onChange={(spId) => {
          sc.emit(SOCKET_MSG_TAG_API.API_BIND_SNIPPET, it.parsedUrl.shortHref, spId)
        }}
        style={{ width: '200px' }}
        placeholder="选择Snippet可篡改Resp"
        allowClear
      >
        {snippets.map((it) => <Select.Option
          value={it.id}
          key={it.id}
        >{it.name}</Select.Option>)}
      </Select>
      <Divider type="vertical"></Divider>
      <div>
        <Tag>{it.req.method}</Tag>
      </div>
    </div>}></List>
    {!!code && <Editor
      value={code}
      readOnly
      onClose={() => { setHttpDetail(null) }}
    ></Editor>}
  </section>
}
