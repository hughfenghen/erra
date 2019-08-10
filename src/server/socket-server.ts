import http from 'http';
import socketIO from 'socket.io';

import { SocketListener } from '../lib/interface';

const app = http.createServer()
app.listen(63236);
const io = socketIO(app);

const onlineSocketSet = new Set<socketIO.Socket>()
const eventListeners: { [x: string]: SocketListener} = {}

io.on('connection', socket => {
  onlineSocketSet.add(socket)
  
  socket.on('test', (arg) => {
    console.log('------ test', arg);
  })
  Object.entries(eventListeners)
    .forEach(([evtName, listener]) => {
      socket.on(evtName, listener)
    })

  socket.on('disconnect', (...args) => {
    onlineSocketSet.delete(socket)
  })
})

function broadcast(eventName: string, ...args) {
  onlineSocketSet.forEach((s) => { s.emit(eventName, ...args) })
}

function once(eventName: string): Promise<{ url: string, code: string }> {
  return Promise.race(Array.from(onlineSocketSet).map((s) => new Promise<{ url: string, code: string }>((resolve) => {
    // todo: off event
    s.once(eventName, ({url, code}) => {
      resolve({ url, code })
    })
  })))
}

function on(evtName: string, cb: SocketListener) {
  if (eventListeners[evtName]) return
  
  eventListeners[evtName] = cb
  Array.from(onlineSocketSet)
    .forEach((socket) => {
      socket.on(evtName, cb)
    })
}

// todo: off event
export default {
  broadcast,
  on,
  once,
}