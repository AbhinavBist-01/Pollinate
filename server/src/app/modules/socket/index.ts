import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";

let io: Server;

const allowedOrigins = (
  process.env.CORS_ORIGIN || "http://localhost:3000,http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: { origin: allowedOrigins, credentials: true },
  });

  io.on("connection", (socket) => {
    async function emitParticipantCount(pollId: string) {
      const count = (await io.in(`poll:${pollId}`).fetchSockets()).length;
      io.to(`poll:${pollId}`).emit("participant:count", { pollId, count });
    }

    socket.on("poll:join", async (pollId: string) => {
      socket.join(`poll:${pollId}`);
      await emitParticipantCount(pollId);
    });

    socket.on("poll:leave", async (pollId: string) => {
      socket.leave(`poll:${pollId}`);
      await emitParticipantCount(pollId);
    });

    socket.on("disconnecting", () => {
      const pollIds = [...socket.rooms]
        .filter((room) => room.startsWith("poll:"))
        .map((room) => room.slice("poll:".length));
      setTimeout(() => {
        pollIds.forEach((pollId) => void emitParticipantCount(pollId));
      }, 0);
    });
  });

  return io;
}

export function emitResponseNew(pollId: string) {
  if (io) {
    io.to(`poll:${pollId}`).emit("response:new", { pollId });
  }
}
