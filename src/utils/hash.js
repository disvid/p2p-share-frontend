/**
 * hash.js
 * SHA-256 hashing using the browser's native Web Crypto API.
 * Works on any modern browser — no external library needed.
 */

/**
 * Compute SHA-256 hash of an ArrayBuffer or File/Blob.
 * Returns a lowercase hex string like "a3f2b1...".
 *
 * @param {ArrayBuffer | Blob | File} data
 * @returns {Promise<string>} hex digest
 */
export async function sha256(data) {
  let buffer;

  if (data instanceof ArrayBuffer) {
    buffer = data;
  } else if (data instanceof Blob || data instanceof File) {
    buffer = await data.arrayBuffer();
  } else {
    throw new TypeError('sha256: expected ArrayBuffer, Blob, or File');
  }

  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}