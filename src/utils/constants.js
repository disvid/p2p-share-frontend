/**
 * constants.js
 * Shared configuration values used across the app.
 */

// Max file size: 50 MB
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

// DataChannel chunk size: 16 KB
export const CHUNK_SIZE = 16 * 1024;

// WebRTC ICE servers (STUN only — TURN would require credentials)
export const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' },
];

// DataChannel label
export const DATA_CHANNEL_LABEL = 'file-transfer';

// Message types sent over DataChannel
export const MSG_TYPE = {
  METADATA: 'metadata',
  CHUNK: 'chunk',
  COMPLETE: 'complete',
  HASH: 'hash',
};

// Connection status labels
export const CONN_STATUS = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  TRANSFERRING: 'transferring',
  DONE: 'done',
  ERROR: 'error',
  DISCONNECTED: 'disconnected',
  PEER_LEFT: 'peer_left',
};