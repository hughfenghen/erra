import EventEmitter from 'events';

const ee = new EventEmitter()
const config = new Map<string, any>()

function init () {
  // 解析配置
  // 内部lib初始化
  ee.emit('afterConfigInit')
}

export default {
  init,
  get(key: string) {
    return config.get(key)
  },
  on(evtName, handler) {
    return ee.on(evtName, handler)
  },
  emit(evtName: string, ...args) {
    return ee.emit(evtName, ...args)
  },
}