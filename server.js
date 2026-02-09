
/**
 * MOSQUITO MAYHEM - BACKEND SERVER (Node.js + Socket.io)
 * This is a standalone file to be deployed to a Node.js environment.
 */
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomCode, playerName) => {
    socket.join(roomCode);
    if (!rooms.has(roomCode)) {
      rooms.set(roomCode, { players: [], bites: 0, status: 'lobby' });
    }
    const room = rooms.get(roomCode);
    const newPlayer = { id: socket.id, name: playerName, role: 'MOSQUITO', position: [0,0,0], isAlive: true };
    room.players.push(newPlayer);
    
    io.to(roomCode).emit('room-update', room);
  });

  socket.on('sync-position', (roomCode, data) => {
    socket.to(roomCode).emit('player-moved', { id: socket.id, ...data });
  });

  socket.on('bite', (roomCode) => {
    const room = rooms.get(roomCode);
    if (room) {
      room.bites += 0.1;
      io.to(roomCode).emit('stats-update', { bites: room.bites });
    }
  });

  socket.on('squash', (roomCode, targetId) => {
    io.to(roomCode).emit('player-squashed', targetId);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
    // Basic cleanup logic would go here
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Mosquito Mayhem Server running on port ${PORT}`);
});
