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
        setError(`File too large. Max size is 2 GB ${formatBytes(MAX_FILE_SIZE)}.`);
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
      processFile(e.dataTransfer.files[0]);
    },
    [processFile]
  );

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center gap-3
          w-full min-h-[220px] rounded-2xl border-2
          cursor-pointer select-none transition-all duration-200 overflow-hidden
          ${
            dragging
              ? 'border-accent-500 bg-accent-50 scale-[1.01] shadow-glow'
              : selectedFile
              ? 'border-emerald-300 bg-emerald-50/30 shadow-soft'
              : 'border-zinc-200 bg-white/60 hover:border-accent-300 hover:bg-accent-50/30 hover:shadow-soft'
          }
        `}
        style={{ borderStyle: 'dashed' }}
      >
        {/* Animated gradient background when dragging */}
        {dragging && (
          <div className="absolute inset-0 bg-gradient-brand opacity-5 animate-gradient-shift" />
        )}

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => processFile(e.target.files[0])}
        />

        {selectedFile ? (
          <div className="flex flex-col items-center gap-2 animate-scale-in relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg animate-bounce-subtle">
              <FileIcon />
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-zinc-900">
                {truncateFilename(selectedFile.name)}
              </div>
              <div className="text-xs text-zinc-500 mono mt-0.5">
                {formatBytes(selectedFile.size)}
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
              className="text-xs text-accent-600 hover:text-accent-700 font-medium underline underline-offset-2 mt-1 transition-colors"
            >
              Choose a different file
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 relative z-10">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
              dragging
                ? 'bg-gradient-brand text-white shadow-glow scale-110'
                : 'bg-accent-100 text-accent-600'
            }`}>
              <UploadIcon />
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-zinc-800">
                {dragging ? 'Drop it here!' : 'Drag and drop a file'}
              </div>
              <div className="text-xs text-zinc-500 mt-0.5">or click to browse</div>
              <p className="text-xs text-gray-600">Max 2 GB · Any file type · End-to-end encrypted</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 animate-fade-in">
          {error}
        </div>
      )}
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
