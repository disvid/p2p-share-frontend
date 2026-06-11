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
        setError(`File too large. Max ${formatBytes(MAX_FILE_SIZE)}.`);
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
    <div className="w-full">
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
          w-full min-h-[200px] rounded-xl border
          cursor-pointer select-none transition-colors duration-150
          ${
            dragging
              ? 'border-zinc-900 bg-zinc-50'
              : selectedFile
              ? 'border-zinc-300 bg-white'
              : 'border-zinc-200 bg-white hover:border-zinc-300'
          }
        `}
        style={{ borderStyle: 'dashed' }}
      >
        <input ref={inputRef} type="file" className="hidden" onChange={(e) => processFile(e.target.files[0])} />

        {selectedFile ? (
          <div className="flex flex-col items-center gap-2 px-6 py-2 text-center animate-fade-in">
            <FileIcon />
            <div>
              <p className="text-sm font-medium text-zinc-900">
                {truncateFilename(selectedFile.name)}
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">{formatBytes(selectedFile.size)}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
              className="text-xs text-zinc-400 hover:text-zinc-700 underline underline-offset-2 mt-1"
            >
              Choose a different file
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 px-6 py-2 text-center">
            <UploadIcon />
            <div>
              <p className="text-sm text-zinc-700">
                Drag and drop a file
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">or click to browse</p>
            </div>
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-300">
      <path d="M12 16V4M12 4L7 9M12 4l5 5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}