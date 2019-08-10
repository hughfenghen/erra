import EventEmitter from 'events';
import path from 'path';

const ee = new EventEmitter()
const config = new Map<string, any>()

async function init (cfgUrl) {
  const cfg = await import(path.resolve(process.cwd(), cfgUrl))
  delete cfg.default

  Object.entries(cfg)
    .forEach(([key, val]) => {
      config.set(key, val)
    })
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