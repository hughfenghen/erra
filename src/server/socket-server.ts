import https from 'https';
import socketIO from 'socket.io';
import { createSecureContext } from 'tls';

import { SocketListener } from '../lib/interface';
import { createCert } from '../lib/cert';

const onlineSocketSet = new Set<socketIO.Socket>()
const eventListeners: { [x: string]: SocketListener } = {}

async function run(port) {
  const serverCrt = await createCert('internal_https_server');

  const app = https.createServer({
    cert: serverCrt.cert,
    key: serverCrt.key,
    async SNICallback(servername, cb) {
      const { cert, key } = await createCert(servername)
      cb(null, createSecureContext({ cert, key }))
    },
  })
  const io = socketIO(app);
  app.listen(port);

  io.on('connection', socket => {
    onlineSocketSet.add(socket)

    Object.entries(eventListeners)
      .forEach(([evtName, listener]) => {
        socket.on(evtName, listener)
      })

    socket.on('disconnect', (...args) => {
      onlineSocketSet.delete(socket)
    })
  })
}


function broadcast(eventName: string, ...args) {
  onlineSocketSet.forEach((s) => { s.emit(eventName, ...args) })
}

function once(eventName: string): Promise<any> {
  return Promise.race(
    Array.from(onlineSocketSet).map((s) => new Promise((resolve) => {
      function listener(data) {
        resolve(data)
        offEvtListener()
      }
      function offEvtListener() {
        Array.from(onlineSocketSet).forEach((s) => { s.removeListener(eventName, listener) })
      }

      s.once(eventName, listener)
    }))
  )
}

function on(evtName: string, cb: SocketListener) {
  if (eventListeners[evtName]) return

  eventListeners[evtName] = cb
  Array.from(onlineSocketSet)
    .forEach((socket) => {
      socket.on(evtName, cb)
    })
}

export default {
  broadcast,
  on,
  once,
  run,
}