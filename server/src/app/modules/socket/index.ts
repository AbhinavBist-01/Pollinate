import type { Server as HttpServer } from "node:http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { eq } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { pollsTable } from "../../../db/schema.js";

let io: Server;
const JWT_SECRET = process.env.JWT_SECRET || "pollinate-jwt-secret-dev";

export interface PollLiveState {
  pollId: string;
  currentQuestionIndex: number;
  currentQuestionId: string;
  isActive: boolean;
  acceptingResponses: boolean;
  isCompleted: boolean;
  startedAt: string | null;
  endsAt: string | null;
}

const liveStates = new Map<string, PollLiveState>();
const liveStateTimers = new Map<string, ReturnType<typeof setTimeout>>();

const allowedOrigins = (
  process.env.CORS_ORIGIN || "http://localhost:3000,http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function isPollLiveState(value: unknown): value is PollLiveState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<PollLiveState>;
  return (
    typeof state.pollId === "string" &&
    Number.isInteger(state.currentQuestionIndex) &&
    typeof state.currentQuestionId === "string" &&
    typeof state.isActive === "boolean" &&
    typeof state.acceptingResponses === "boolean" &&
    typeof state.isCompleted === "boolean" &&
    (typeof state.startedAt === "string" || state.startedAt === null) &&
    (typeof state.endsAt === "string" || state.endsAt === null)
  );
}

async function canControlPoll(token: unknown, pollId: string) {
  if (typeof token !== "string" || !token) return false;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id?: string };
    if (!payload.id) return false;
    const [poll] = await db
      .select({ ownerId: pollsTable.ownerId })
      .from(pollsTable)
      .where(eq(pollsTable.id, pollId));
    return poll?.ownerId === payload.id;
  } catch {
    return false;
  }
}

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
      socket.emit("poll:live-state", {
        pollId,
        state: getPollLiveState(pollId) ?? null,
      });
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

    socket.on("poll:live-state:set", async (payload: unknown) => {
      const state =
        payload && typeof payload === "object" && "state" in payload
          ? (payload as { state?: unknown }).state
          : payload;
      const token =
        payload && typeof payload === "object" && "token" in payload
          ? (payload as { token?: unknown }).token
          : null;

      if (!isPollLiveState(state)) {
        socket.emit("poll:live-state:error", {
          message: "Invalid live state payload",
        });
        return;
      }

      const allowed = await canControlPoll(token, state.pollId);
      if (!allowed) {
        socket.emit("poll:live-state:error", {
          message: "Only the poll owner can control the live quiz",
        });
        return;
      }

      const nextState = setPollLiveState(state);
      io.to(`poll:${state.pollId}`).emit("poll:live-state", {
        pollId: state.pollId,
        state: nextState,
      });
    });
  });

  return io;
}

export function getPollLiveState(pollId: string) {
  const state = liveStates.get(pollId);
  if (!state) return null;

  if (
    state.acceptingResponses &&
    state.endsAt &&
    new Date(state.endsAt).getTime() <= Date.now()
  ) {
    const closedState = { ...state, acceptingResponses: false };
    liveStates.set(pollId, closedState);
    return closedState;
  }

  return state;
}

export function setPollLiveState(state: PollLiveState) {
  const existingTimer = liveStateTimers.get(state.pollId);
  if (existingTimer) clearTimeout(existingTimer);

  const nextState = {
    ...state,
    acceptingResponses:
      !state.isCompleted &&
      state.acceptingResponses &&
      Boolean(state.endsAt) &&
      new Date(state.endsAt!).getTime() > Date.now(),
  };

  liveStates.set(state.pollId, nextState);

  if (nextState.acceptingResponses && nextState.endsAt) {
    const delay = Math.max(
      0,
      new Date(nextState.endsAt).getTime() - Date.now(),
    );
    const timer = setTimeout(() => {
      const latest = liveStates.get(nextState.pollId);
      if (!latest) return;
      const closedState = { ...latest, acceptingResponses: false };
      liveStates.set(nextState.pollId, closedState);
      io?.to(`poll:${nextState.pollId}`).emit("poll:live-state", {
        pollId: nextState.pollId,
        state: closedState,
      });
    }, delay);
    liveStateTimers.set(nextState.pollId, timer);
  }

  return nextState;
}

export function emitResponseNew(pollId: string) {
  if (io) {
    io.to(`poll:${pollId}`).emit("response:new", { pollId });
  }
}
