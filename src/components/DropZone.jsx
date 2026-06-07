/**
 * DropZone.jsx
 * Drag-and-drop + click-to-browse file selection.
 * Shows file info after selection and validates size limit.
 */

import React, { useRef, useState, useCallback } from 'react';
import { MAX_FILE_SIZE } from '../utils/constants.js';
import { formatBytes, truncateFilename } from '../utils/format.js';

export default function DropZone({ onFileSelect, selectedFile }) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const processFile = useCallback(
    (file) => {
      if (!file) return;
      if (file.size > MAX_FILE_SIZE) {
        setError(`File too large. Max size is 50 MB. Your file: ${formatBytes(file.size)}`);
        return;
      }
      setError('');
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      processFile(file);
    },
    [processFile]
  );

  const onDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const onDragLeave = () => setDragging(false);

  const onInputChange = (e) => {
    processFile(e.target.files[0]);
  };

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={0}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center gap-4
          w-full min-h-[220px] rounded-2xl border-2 border-dashed
          cursor-pointer select-none
          transition-all duration-200
          ${
            dragging
              ? 'border-brand-400 bg-brand-500/10 drop-active scale-[1.01]'
              : selectedFile
              ? 'border-emerald-500/60 bg-emerald-500/5'
              : 'border-gray-600 bg-gray-800/40 hover:border-brand-500/60 hover:bg-gray-800/60'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={onInputChange}
          // Accept all file types
        />

        {selectedFile ? (
          /* File selected state */
          <div className="flex flex-col items-center gap-3 p-6 text-center animate-fade-in">
            <div className="text-5xl">{getFileEmoji(selectedFile.name)}</div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-white">
                {truncateFilename(selectedFile.name)}
              </p>
              <p className="text-sm text-gray-400">{formatBytes(selectedFile.size)}</p>
              <p className="text-xs text-gray-500">{selectedFile.type || 'Unknown type'}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
              className="mt-1 text-xs text-brand-400 hover:text-brand-300 underline underline-offset-2"
            >
              Change file
            </button>
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-700/60 text-3xl">
              📂
            </div>
            <div className="space-y-1">
              <p className="text-base font-medium text-gray-200">
                {dragging ? 'Drop it here!' : 'Drag & drop your file'}
              </p>
              <p className="text-sm text-gray-500">
                or{' '}
                <span className="text-brand-400 hover:text-brand-300 underline underline-offset-2">
                  click to browse
                </span>
              </p>
            </div>
            <p className="text-xs text-gray-600">Max 50 MB · Any file type</p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
          <span>⚠️</span> {error}
        </p>
      )}
    </div>
  );
}

/** Returns an emoji based on file extension for visual flair. */
function getFileEmoji(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const map = {
    pdf: '📄', doc: '📝', docx: '📝',
    xls: '📊', xlsx: '📊', csv: '📊',
    jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', webp: '🖼️', svg: '🖼️',
    mp4: '🎬', mov: '🎬', avi: '🎬', mkv: '🎬',
    mp3: '🎵', wav: '🎵', flac: '🎵', ogg: '🎵',
    zip: '📦', rar: '📦', tar: '📦', gz: '📦',
    js: '💻', ts: '💻', jsx: '💻', tsx: '💻', py: '💻', java: '💻',
    html: '🌐', css: '🎨', json: '⚙️',
    txt: '📋', md: '📋',
  };
  return map[ext] || '📁';
}