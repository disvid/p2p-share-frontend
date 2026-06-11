export const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2 GB (OPFS-backed)
export const CHUNK_SIZE = 16 * 1024;
export const MAX_HASH_VERIFY_SIZE = 300 * 1024 * 1024; // skip full hash above 300MB

export const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' },
];

export const DATA_CHANNEL_LABEL = 'file-transfer';

export const MSG_TYPE = {
  METADATA: 'metadata',
  CHUNK: 'chunk',
  COMPLETE: 'complete',
  HASH: 'hash',
};

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