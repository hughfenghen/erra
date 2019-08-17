
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
  statusCode?: number,
  headers: Object,
  body?: any,
}

export interface ApiRecord {
  uuid: string,
  req: SimpleReq,
  resp?: SimpleResp,
}

export type SocketListener = (...args: any[]) => void

export enum SOCKET_MSG_TAG_API {
  GET_HISTORY = 'api_manager-get_history',
  NEW_RECORD = 'api_manager-new_record',
  REPLACE_RECORD = 'api_manager-replace_record',
  CLEAR_RECORD = 'api_manager-clear_record',
  GET_BREAKPOINTS = 'breakpoint_manager-get',
  UPDATE_BREAKPOINTS = 'breakpoint_manager-update',
  UPDATE_BREAKPOINT_BY_URL = 'breakpoint_manager-update_by_url',
}

export enum API_DATA_TYPE {
  REQUEST = 'request',
  RESPONSE = 'response',
}

export interface BreakPoint {
  url: string,
  type: API_DATA_TYPE,
}