import { io } from "socket.io-client";
import { getToken } from "./api";

const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:8000";

export const socket = io(socketUrl, { autoConnect: false });

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

export function joinPollRoom(pollId: string) {
  socket.emit("poll:join", pollId);
}

export function leavePollRoom(pollId: string) {
  socket.emit("poll:leave", pollId);
}

export function onResponseNew(callback: (data: { pollId: string }) => void) {
  socket.on("response:new", callback);
}

export function offResponseNew(callback: (data: { pollId: string }) => void) {
  socket.off("response:new", callback);
}

export function onParticipantCount(
  callback: (data: { pollId: string; count: number }) => void,
) {
  socket.on("participant:count", callback);
}

export function offParticipantCount(
  callback: (data: { pollId: string; count: number }) => void,
) {
  socket.off("participant:count", callback);
}

export function setPollLiveState(state: PollLiveState) {
  socket.emit("poll:live-state:set", { state, token: getToken() });
}

export function onPollLiveState(
  callback: (data: { pollId: string; state: PollLiveState | null }) => void,
) {
  socket.on("poll:live-state", callback);
}

export function offPollLiveState(
  callback: (data: { pollId: string; state: PollLiveState | null }) => void,
) {
  socket.off("poll:live-state", callback);
}
