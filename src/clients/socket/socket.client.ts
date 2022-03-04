import { Server } from 'socket.io';
import express from 'express';

const http = require('http');

export const createSocketClient = (app: express.Express) => {
  const server = http.createServer(app);
  const socketClient = new Server(server);

  socketClient.on('connection', socket => {
    socket.on('signin', data => {
      const userId = data.userId;
      socket.join(`user:${userId}`);
    });
  });
  return socketClient;
};
