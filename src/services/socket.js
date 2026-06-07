/**
 * socket.js — Production-ready
 *
 * VITE_SOCKET_URL must be set:
 *   - Local dev:   http://localhost:4000
 *   - ngrok test:  https://abc123.ngrok-free.app
 *   - Production:  https://p2p-share-backend.onrender.com
 */

import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

console.log('[socket] connecting to:', SOCKET_URL);

export const socket = io(SOCKET_URL, {
  autoConnect:           false,
  reconnectionAttempts:  10,
  reconnectionDelay:     1000,
  reconnectionDelayMax:  8000,
  timeout:               30000,
  // Always try WebSocket first; fall back to polling if firewall blocks WS
  transports: ['websocket', 'polling'],
});

socket.on('connect',       ()  => console.log('[socket] connected:', socket.id));
socket.on('disconnect',    (r) => console.log('[socket] disconnected:', r));
socket.on('connect_error', (e) => console.error('[socket] connect_error:', e.message));
socket.on('reconnect',     (n) => console.log('[socket] reconnected after', n, 'attempts'));

export function ensureConnected() {
  if (!socket.connected && !socket.connecting) {
    socket.connect();
  }
}

export function disconnectSocket() {
  socket.removeAllListeners();
  socket.disconnect();
}