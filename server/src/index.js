// src/index.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const { initSocket } = require("./socket");

// Import routes
const authRoutes = require("../routes/auth");
const userRoutes = require("../routes/User");
const reelRoutes = require("../routes/reels");
const chatRoutes = require("../routes/chat");

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend safely using absolute path
const clientPath = path.resolve(__dirname, "../../client");
app.use(express.static(clientPath));

// Serve uploaded files
const uploadsPath = path.resolve(__dirname, "../uploads");
app.use("/uploads", express.static(uploadsPath));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reels", reelRoutes);
app.use("/api/chat", chatRoutes);

// Catch-all route for SPA
app.get("*", (req, res) => {
  res.sendFile(path.resolve(clientPath, "index.html"));
});

// Function to find available port
const findAvailablePort = (startPort) => {
  return new Promise((resolve) => {
    const server = require('net').createServer();
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
};

// Connect to MongoDB and start server
let PORT = parseInt(process.env.PORT) || 3001;

// Validate port is within valid range (0-65535)
if (PORT < 0 || PORT > 65535) {
  console.warn(`Invalid port ${PORT} specified, using default port 3001`);
  PORT = 3001;
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    const availablePort = await findAvailablePort(PORT);
    const server = app.listen(availablePort, () => {
      console.log(`Server running on port ${availablePort}`);
      if (availablePort !== parseInt(PORT)) {
        console.log(`Note: Port ${PORT} was busy, using port ${availablePort} instead`);
      }
    });

    // Initialize Socket.io
    initSocket(server);
  })
  .catch((err) => console.error("MongoDB connection error:", err));
