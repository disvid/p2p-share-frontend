/**
 * format.js
 * Human-readable formatting helpers for sizes, speeds, and times.
 */

/**
 * Format bytes as a human-readable string.
 * e.g. 1048576 → "1.00 MB"
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

/**
 * Format transfer speed in MB/s.
 * @param {number} bytesPerSecond
 */
export function formatSpeed(bytesPerSecond) {
  if (bytesPerSecond <= 0 || !isFinite(bytesPerSecond)) return '0.00 MB/s';
  const mb = bytesPerSecond / (1024 * 1024);
  if (mb < 0.01) return `${(bytesPerSecond / 1024).toFixed(2)} KB/s`;
  return `${mb.toFixed(2)} MB/s`;
}

/**
 * Format seconds into a human-readable ETA string.
 * @param {number} seconds
 */
export function formatETA(seconds) {
  if (!isFinite(seconds) || seconds <= 0) return '—';
  if (seconds < 60) return `${Math.ceil(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.ceil(seconds % 60);
  return `${m}m ${s}s`;
}

/**
 * Truncate a long filename in the middle.
 * e.g. "very-long-file-name.pdf" → "very-long...me.pdf"
 */
export function truncateFilename(name, maxLen = 40) {
  if (name.length <= maxLen) return name;
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : '';
  const base = name.slice(0, maxLen - ext.length - 3);
  return `${base}...${ext}`;
}