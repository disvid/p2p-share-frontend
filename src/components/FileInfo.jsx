/**
 * FileInfo.jsx
 * Displays file metadata (name, size, type) in a clean card row.
 */

import React from 'react';
import { formatBytes, truncateFilename } from '../utils/format.js';

export default function FileInfo({ file, label = 'File' }) {
  if (!file) return null;

  return (
    <div className="flex items-center gap-3 rounded-xl bg-gray-800/60 border border-gray-700/50 px-4 py-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-700 text-xl">
        📁
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-white truncate">
          {truncateFilename(file.name || file.filename, 45)}
        </p>
        <p className="text-xs text-gray-400">
          {formatBytes(file.size || file.filesize)}
          {file.type ? ` · ${file.type}` : ''}
        </p>
      </div>
    </div>
  );
}