// src/socket.js
const { Server } = require("socket.io");

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*", // you can restrict to your frontend URL later
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("A user connected: " + socket.id);

    // Join a chat room
    socket.on("joinRoom", (roomId) => {
      socket.join(roomId);
      console.log(`${socket.id} joined room ${roomId}`);
    });

    // Handle sending a message
    socket.on("sendMessage", (data) => {
      const { roomId, message } = data;
      io.to(roomId).emit("receiveMessage", message);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log("A user disconnected: " + socket.id);
    });
  });
}

function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
}

module.exports = { initSocket, getIO };
