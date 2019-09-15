import { Button, Checkbox, Divider, Icon, List, Popover, Select, Tag } from 'antd';
import yaml from 'js-yaml';
import { isEmpty } from 'lodash/fp';
import React, { useCallback, useEffect, useState } from 'react';

import { API_DATA_TYPE, ApiRecord, SimpleReq, SimpleResp, SOCKET_MSG_TAG_API, BPMsg } from '../lib/interface';
import { useSnippets } from './common/custom-hooks';
import Editor from './common/editor';
import sc from './common/socket-client';
import s from './style.less';

export default function ApiRecords() {
  const [apiList, setApiList] = useState<ApiRecord[]>([])
  const [breakpoints, setBreakpoints] = useState({})
  const snippets = useSnippets()

  const [bpMsg, setBPMsg] = useState<BPMsg>({} as BPMsg)
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
    // 断点开始，弹出code编辑框，可查看编辑requst、response
    sc.on(SOCKET_MSG_TAG_API.BP_START, (bpMsg) => {
      setHttpDetail(bpMsg.httpDetail)
      setBPMsg(bpMsg)
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
    // apiList改变后 需要清空已有的监听器
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

    if (
      /application\/json/.test(httpDetail.headers['content-type'])
      && typeof httpDetail.body === 'string'
    ) {
      setCode(yaml.safeDump({
        ...httpDetail,
        // 解析成json对象，yaml语法阅读优化
        body: JSON.parse(httpDetail.body)
      }))
      return
    }
    setCode(yaml.safeDump(httpDetail))
  }, [httpDetail])

  const debugColor = useCallback((bpTypes = []) => {
    if (bpTypes.length === 2) return '#b37feb'
    if (bpTypes.includes(API_DATA_TYPE.REQUEST)) return '#85a5ff'
    if (bpTypes.includes(API_DATA_TYPE.RESPONSE)) return '#ff85c0'
  }, [])

  return <section className={s.apiRecord}>
    <List dataSource={apiList} renderItem={(it: ApiRecord) => <div className={s.listItem}>
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
        <div className={[
          s.debugWrap,
          bpMsg.uuid === it.uuid ? s.debugging : '',
        ].join(' ')}>
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
        <Button size="small" disabled={!!bpMsg.uuid} onClick={() => {
          onViewDetail(it, 'req')
        }}>show req</Button>
        <br />
        <Button size="small" onClick={() => {
          onViewDetail(it, 'resp')
        }} disabled={!!bpMsg.uuid || isEmpty(it.resp)}>show resp</Button>
      </span>
      <Divider type="vertical"></Divider>
      <div>
        <Tag>{it.req.method}</Tag>
      </div>
      <Divider type="vertical"></Divider>
      <div>
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
    </div>}></List>
    {!!code && <Editor
      value={code}
      onChange={(val) => { setCode(val) }}
      language="yaml"
      readOnly={!bpMsg.uuid}
      onClose={() => {
        // debug中禁用ESC关闭快捷键
        if (!!bpMsg.uuid) return
        setHttpDetail(null)
      }}
    >
      {bpMsg.uuid && <Button onClick={() => {
        sc.emit(SOCKET_MSG_TAG_API.BP_DONE + bpMsg.uuid + bpMsg.bpType, yaml.safeLoad(code))
        setBPMsg({} as BPMsg)
      }}>完成</Button>}
    </Editor>}
  </section>
}
