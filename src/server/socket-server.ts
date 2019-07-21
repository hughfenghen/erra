import http from 'http';
import socketIO from 'socket.io';

const app = http.createServer()
app.listen(63236);
const io = socketIO(app);

const onlineSocketSet = new Set<socketIO.Socket>()

io.on('connection', socket => {
  onlineSocketSet.add(socket)
  socket.on('test', (arg) => {
    console.log('------ test', arg);
  })
  socket.on('disconnect', (...args) => {
    onlineSocketSet.delete(socket)
  })
})

export function broadcast(eventName: string, ...args) {
  onlineSocketSet.forEach((s) => { s.emit(eventName, ...args) })
}

export function listenOnline(eventName: string): Promise<{ url: string, code: string }> {
  return Promise.race(Array.from(onlineSocketSet).map((s) => new Promise<{ url: string, code: string }>((resolve) => {
    s.on(eventName, ({url, code}) => {
      console.log(111111, url, code);
      resolve({ url, code })
    })
    // resolve({ url: '', code: '' })
  })))
}