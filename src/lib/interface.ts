
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
  GET_HISTORY = 'api_manager-get_history',
  NEW_RECORD = 'api_manager-new_record',
  REPLACE_RECORD = 'api_manager-replace_record',
  CLEAR_RECORD = 'api_manager-clear_record',
  UPDATE_RECORD = 'api_manager-update_record',
  BP_GET = 'breakpoint_manager-get',
  BP_UPDATE = 'breakpoint_manager-update',
  BP_UPDATE_BY_URL = 'breakpoint_manager-update_by_url',
  BP_DONE = 'breakpoint_manager-done',
  BP_START = 'breakpoint_manager-start'
}

export enum API_DATA_TYPE {
  REQUEST = 'request',
  RESPONSE = 'response',
}

export interface BreakPoint {
  url: string,
  type: API_DATA_TYPE,
}