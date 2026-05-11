import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";

let io: Server;

export function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: { origin: process.env.CORS_ORIGIN || "http://localhost:5173", credentials: true },
  });

  io.on("connection", (socket) => {
    socket.on("poll:join", (pollId: string) => {
      socket.join(`poll:${pollId}`);
    });
  });

  return io;
}

export function emitResponseNew(pollId: string) {
  if (io) {
    io.to(`poll:${pollId}`).emit("response:new", { pollId });
  }
}
