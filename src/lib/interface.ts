import { IncomingMessage } from "http"

export interface StrObj {
  [x: string]: string,
}

export interface ParsedUrl {
  host?: string,
  pathname?: string,
  port?: string,
  protocol?: string,
  origin?: string,
  search?: string,
  hash?: string,
  // 用来作为关联断点、Snippet的key，由 `${url.origin}${url.pathname}` 组成
  shortHref?: string,
  href?: string,
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS' | 'PATCH'
export interface SimpleReq {
  // 插入一个id到http IncomingMessage对象中，在handleResp中可以通过此id关联到对应的request记录
  __erra_uuid__: string,
  url: string,
  method: HttpMethod,
  headers: StrObj,
  body?: any,
}

export interface SimpleResp {
  statusCode: number,
  headers: Object,
  body?: any,
}

export interface ApiRecord {
  uuid: string,
  parsedUrl: ParsedUrl,
  req: SimpleReq,
  resp?: SimpleResp,
}

export type SocketListener = (...args: any[]) => void

/**
 * socket.io 消息 tag定义
 */
export enum SOCKET_MSG_TAG_API {
  API_GET_HISTORY = 'api_manager-get_history',
  API_GET_RECORD_DETAIL = 'api_manager-get_detail',
  API_NEW_RECORD = 'api_manager-new_record',
  API_REPLACE_RECORD = 'api_manager-replace_record',
  API_CLEAR_RECORD = 'api_manager-clear_record',
  API_UPDATE_RECORD = 'api_manager-update_record',
  API_BIND_SNIPPET = 'api_manager-bind_snippet',
  API_GET_SNIPPET_RELATION = 'api_manager-get_snippet-relation',
  API_UPDATE_SNIPPET_RELATION = 'api_manager-update_snippet-relation',
  BP_GET = 'breakpoint_manager-get',
  BP_UPDATE = 'breakpoint_manager-update',
  BP_UPDATE_BY_URL = 'breakpoint_manager-update_by_url',
  BP_MSG_DONE = 'breakpoint_manager-msg_done',
  BP_MSG_START = 'breakpoint_manager-msg_start',
  BP_MSG_GET_QUEUE = 'breakpoint_manager-msg_get_queue',
  BP_MSG_PASS_ALL = 'breakpoint_manager-msg_pass_all',
  BP_MSG_NEW = 'breakpoint_manager-msg_new',
  BP_MSG_REMOVE = 'breakpoint_manager-msg_remove',
  BP_MSG_ABORT = 'breakpoint_manager-msg_abort',
  BP_MSG_GET_SWITCH = 'breakpoint_manager-msg_get_switch',
  BP_MSG_UPDATE_SWITCH = 'breakpoint_manager-msg_update_switch',
  SP_GET = 'snippet_manager-get',
  SP_SAVE = 'snippet_manager-save',
  SP_UPDATE = 'snippet_manager-update',
  SP_DELETE = 'snippet_manager-delete',
  SP_ENABLED = 'snippet_manager-enabled',
  SP_SET_ENABLED = 'snippet_manager-set_enabled',
}

export enum API_DATA_TYPE {
  REQUEST = 'request',
  RESPONSE = 'response',
}

/**
 * 用户编辑的Snippet内容，由parseSnippetContent解析成函数
 * 函数可以按配置策略，加上http请求原值 用来生成数据
 */
export type SnippetContent = any

export interface Snippet {
  id: string,
  name: string,
  content: SnippetContent,
  correlationApi?: RegExp,
}

export interface BPMsg {
  uuid: string,
  type: API_DATA_TYPE,
  parsedUrl: ParsedUrl,
  method: HttpMethod,
  httpDetail: SimpleReq | SimpleResp,
  resolve: (data: any) => void,
  reject: (data: any) => void,
}