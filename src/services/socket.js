/**
 * socket.js - Fixed version
 * More robust connection with explicit transport fallback and error handling.
 */

import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  transports: ['websocket', 'polling'], // Try WebSocket first, fall back to polling
});

socket.on('connect_error', (err) => {
  console.error('[socket] connect_error:', err.message);
});

socket.on('connect', () => {
  console.log('[socket] connected:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('[socket] disconnected:', reason);
});

export function ensureConnected() {
  if (!socket.connected && !socket.connecting) {
    console.log('[socket] connecting to', SOCKET_URL);
    socket.connect();
  }
}

export function disconnectSocket() {
  socket.removeAllListeners();
  socket.disconnect();
}