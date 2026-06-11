import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 8000,
  timeout: 60000, // Render free tier cold-start can take ~50s
  transports: ['websocket', 'polling'],
});

socket.on('connect', () => console.log('[socket] connected:', socket.id));
socket.on('disconnect', (r) => console.log('[socket] disconnected:', r));
socket.on('connect_error', (e) => console.error('[socket] connect_error:', e.message));

/**
 * Pre-wake the Render backend BEFORE connecting the socket.
 * This wakes a sleeping free-tier instance so the socket connection
 * (which has a shorter internal handshake timeout) doesn't time out.
 */
export async function wakeBackend() {
  try {
    await fetch(`${SOCKET_URL}/health`, { mode: 'no-cors', cache: 'no-store' });
  } catch (_) {
    // Ignore — this is just a warm-up ping
  }
}

export async function ensureConnected() {
  if (!socket.connected && !socket.connecting) {
    await wakeBackend();
    socket.connect();
  }
}

export function disconnectSocket() {
  socket.removeAllListeners();
  socket.disconnect();
}