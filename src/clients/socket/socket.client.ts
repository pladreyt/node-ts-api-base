import { Server } from 'socket.io';
const http = require('http');

export const createSocketClient = ( app: any ) => {
  const server = http.createServer(app);
  const socketClient = new Server(server);

  socketClient.on('connection', (socket) => {
    socket.on('signin', (data) => {
      const userId = data.userId;
      socket.join(`user:${userId}`);
    });
  });
  return socketClient;
};
