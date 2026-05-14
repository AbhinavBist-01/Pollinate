import { io } from 'socket.io-client'

const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000'

export const socket = io(socketUrl, { autoConnect: false })

export function joinPollRoom(pollId: string) {
  socket.emit('poll:join', pollId)
}

export function leavePollRoom(pollId: string) {
  socket.emit('poll:leave', pollId)
}

export function onResponseNew(callback: (data: { pollId: string }) => void) {
  socket.on('response:new', callback)
}

export function offResponseNew(callback: (data: { pollId: string }) => void) {
  socket.off('response:new', callback)
}

export function onParticipantCount(callback: (data: { pollId: string; count: number }) => void) {
  socket.on('participant:count', callback)
}

export function offParticipantCount(callback: (data: { pollId: string; count: number }) => void) {
  socket.off('participant:count', callback)
}
