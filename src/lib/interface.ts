
export interface StrObj {
  [x: string]: string,
}

export interface SimpleReq {
  [x: string]: any;
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS',
  headers: StrObj,
  body?: any,
}

export interface SimpleResp {
  url: string,
  statusCode: number,
  headers: Object,
  body?: any,
}

export interface ApiRecord {
  uuid: string,
  req: SimpleReq,
  resp?: SimpleResp,
}

export type SocketListener = (...args: any[]) => void

// socket.io 消息 tag定义
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
  BP_DONE = 'breakpoint_manager-done',
  BP_START = 'breakpoint_manager-start',
  SP_GET = 'snippet_manager-get',
  SP_SAVE = 'snippet_manager-save',
  SP_UPDATE = 'snippet_manager-update',
  SP_DELETE = 'snippet_manager-delete',
}

export enum API_DATA_TYPE {
  REQUEST = 'request',
  RESPONSE = 'response',
}

export interface BreakPoint {
  url: string,
  type: API_DATA_TYPE,
}

export interface Snippet {
  id: string,
  name: string,
  content: any,
  correlationApi?: RegExp,
}