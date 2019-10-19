import io from 'socket.io-client';

import { SocketListener } from '../../lib/interface';

const port = (new URL(window.location.href)).searchParams.get('wsPort') || 4455

const socket = io(`https://${window.location.hostname}:${port}`);

socket.on('api-response', (url, data) => {
  console.log('====== api-response', url, data);
})

function on(eventName: string, cb: SocketListener) {
  socket.on(eventName, cb)
}

function emit (eventName: string, ...args) {
  socket.emit(eventName, ...args)
}

export default {
  emit,
  on,
  off(evtName: string, fn?: Function) {
    socket.off(evtName, fn)
  },
}