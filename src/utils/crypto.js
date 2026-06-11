/**
 * crypto.js
 * Zero-knowledge AES-256-GCM encryption.
 * The key NEVER touches the signaling server — it lives only in the
 * URL fragment (#key=...), which browsers never send to servers.
 */

export async function generateEncryptionKey() {
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  const raw = await crypto.subtle.exportKey('raw', key);
  return { key, base64: arrayBufferToBase64Url(raw) };
}

export async function importKeyFromBase64(b64) {
  const raw = base64UrlToArrayBuffer(b64);
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
}

/**
 * Encrypts an ArrayBuffer chunk. Output = [12-byte IV][ciphertext+16-byte tag]
 */
export async function encryptChunk(key, buffer) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, buffer);
  const out = new Uint8Array(12 + ciphertext.byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(ciphertext), 12);
  return out.buffer;
}

export async function decryptChunk(key, buffer) {
  const iv = new Uint8Array(buffer.slice(0, 12));
  const data = buffer.slice(12);
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
}

function arrayBufferToBase64Url(buf) {
  let binary = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToArrayBuffer(b64url) {
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}