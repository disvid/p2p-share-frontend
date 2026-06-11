/**
 * fileWriter.js
 * Writes incoming chunks to Origin Private File System (disk-backed),
 * so the browser tab never has to hold a 500MB file in RAM.
 * Falls back to in-memory array if OPFS isn't supported.
 */

export async function createFileWriter(filename) {
  const safeName = `transfer_${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  if (navigator.storage && navigator.storage.getDirectory) {
    try {
      const root = await navigator.storage.getDirectory();
      const fileHandle = await root.getFileHandle(safeName, { create: true });
      const writable = await fileHandle.createWritable();

      return {
        type: 'opfs',
        write: (chunk) => writable.write(chunk),
        finalize: async () => {
          await writable.close();
          const file = await fileHandle.getFile();
          return file;
        },
        cleanup: async () => {
          try { await root.removeEntry(safeName); } catch (_) {}
        },
      };
    } catch (err) {
      console.warn('OPFS unavailable, falling back to memory:', err);
    }
  }

  // Fallback: in-memory chunks (works fine for smaller files)
  const chunks = [];
  return {
    type: 'memory',
    write: (chunk) => { chunks.push(chunk); },
    finalize: async () => new Blob(chunks),
    cleanup: () => { chunks.length = 0; },
  };
}