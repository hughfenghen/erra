import io from 'socket.io-client';

const socket = io('http://localhost:63236');

socket.emit('test', 111)

socket.on('api-response', (url, data) => {
  console.log('====== api-response', url, data);
})

export function socketListen(eventName: string, cb: Function) {
  socket.on(eventName, cb)
}

export function emit (eventName: string, ...args) {
  socket.emit(eventName, ...args)
}