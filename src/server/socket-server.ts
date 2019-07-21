import http from 'http';
import socketIO from 'socket.io';

const app = http.createServer()
app.listen(63236);
const io = socketIO(app);

io.on('connection', socket => {
  console.log(1111, socket);
  socket.on('test', (arg) => {
    console.log(2222, arg);
  })
})