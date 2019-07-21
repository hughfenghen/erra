import io from 'socket.io-client';

const socket = io('http://localhost:63236');

socket.emit('test', 111)